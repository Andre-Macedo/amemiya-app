import React, {useState, useEffect, useMemo} from 'react';
import { StyleSheet, FlatList, View, TextInput, TouchableOpacity, Text, Pressable, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { DrawerToggleButton } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';

import InstrumentCard from '@/components/instrument-card';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Fonts } from '@/constants/theme';
import { useInstruments } from '@/hooks/use-instruments';

// Import helpers para status e cores
import { getStatusColor, STATUS_LABELS } from '@/utils/status-helper';
import { InstrumentStatusType } from '@/types/entities';

// Tipo do filtro agora usa os valores reais do banco ('active', 'expired'...)
type FilterType = 'Todos' | InstrumentStatusType;

export default function InstrumentsScreen() {
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<FilterType>('Todos');

    const themeScheme = useColorScheme() ?? 'light';
    const insets = useSafeAreaInsets(); // Importante para o FAB

    // Cores do Tema
    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const textSecondary = useThemeColor({}, 'textSecondary');
    const primaryColor = useThemeColor({}, 'primary');
    const borderColor = useThemeColor({}, 'border');

    // Debounce da busca (aguarda 500ms antes de chamar a API)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchText), 500);
        return () => clearTimeout(timer);
    }, [searchText]);

    // Hook da API com Paginação e Filtros
    const {
        data,
        isLoading,
        refetch,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInstruments(activeFilter, debouncedSearch);

    const instruments = useMemo(() => {
        const allItems = data?.pages.flatMap(page => page.data) || [];

        const seen = new Set();

        return allItems.filter(item => {
            const duplicate = seen.has(item.id);
            seen.add(item.id);
            return !duplicate; // Só retorna se não vimos este ID ainda
        });
    }, [data]);

    // Componente de Chip de Filtro
    const FilterChip = ({ label, value }: { label: string, value: FilterType }) => {
        const isActive = activeFilter === value;

        // Define a cor do chip (se for 'Todos', usa primary, senão usa a cor do status)
        let chipColor = primaryColor;
        if (value !== 'Todos') {
            chipColor = getStatusColor(value, themeScheme);
        }

        return (
            <Pressable
                onPress={() => setActiveFilter(value)}
                style={[
                    styles.chip,
                    {
                        backgroundColor: isActive ? chipColor : cardBg,
                        borderColor: isActive ? chipColor : borderColor,
                    }
                ]}
            >
                <Text style={[
                    styles.chipText,
                    {
                        color: isActive ? '#FFF' : textSecondary,
                        fontFamily: isActive ? Fonts.sansSemiBold : Fonts.sans
                    }
                ]}>
                    {label}
                </Text>
            </Pressable>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['right', 'left']}>
            <Stack.Screen
                options={{
                    title: 'Instrumentos',
                    headerLeft: () => <DrawerToggleButton tintColor={textColor} />,
                    headerStyle: { backgroundColor: bgColor },
                    headerShadowVisible: false,
                    headerTitleStyle: { fontFamily: Fonts.sansBold, color: textColor }
                }}
            />

            <View style={styles.headerContainer}>
                {/* Barra de Busca */}
                <View style={[styles.searchBar, { backgroundColor: cardBg, borderColor }]}>
                    <Ionicons name="search" size={20} color={textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={[styles.searchInput, { color: textColor, fontFamily: Fonts.sans }]}
                        placeholder="Buscar por nome ou serial..."
                        placeholderTextColor={textSecondary}
                        value={searchText}
                        onChangeText={setSearchText}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Ionicons name="close-circle" size={20} color={textSecondary} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filtros usando os Labels corretos */}
                <View style={styles.filtersRow}>
                    <FilterChip value="Todos" label="Todos" />
                    <FilterChip value="active" label={STATUS_LABELS['active']} />
                    <FilterChip value="expired" label={STATUS_LABELS['expired']} />
                    <FilterChip value="in_calibration" label={STATUS_LABELS['in_calibration']} />
                </View>
            </View>

            {/* Lista de Instrumentos */}
            <FlatList
                data={instruments}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <InstrumentCard item={item} />}
                contentContainerStyle={[styles.listContainer, { paddingBottom: 100 + insets.bottom }]} // Padding seguro no fim da lista
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}

                // Configurações de Refresh e Paginação
                onRefresh={refetch}
                refreshing={isLoading}
                onEndReached={() => {
                    if (hasNextPage) fetchNextPage();
                }}
                onEndReachedThreshold={0.5}

                // Loader no rodapé quando estiver carregando mais itens
                ListFooterComponent={
                    isFetchingNextPage ? <ActivityIndicator style={{ margin: 20 }} color={primaryColor} /> : null
                }

                // Estado Vazio
                ListEmptyComponent={
                    !isLoading ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={64} color={textSecondary + '40'} />
                            <Text style={[styles.emptyTitle, { color: textSecondary }]}>Nenhum instrumento encontrado</Text>
                            <Text style={[styles.emptySubtitle, { color: textSecondary }]}>
                                Tente ajustar os filtros ou sua busca.
                            </Text>
                        </View>
                    ) : null
                }
            />

            {/* FAB com posição segura */}
            <Pressable
                style={({ pressed }) => [
                    styles.fab,
                    {
                        bottom: 30 + insets.bottom,
                        backgroundColor: primaryColor,
                        opacity: pressed ? 0.8 : 1
                    }
                ]}
                onPress={() => console.log("Novo Instrumento")}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </Pressable>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 10,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 50,
        borderRadius: 12,
        borderWidth: 1,
        paddingHorizontal: 15,
        marginBottom: 15,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    filtersRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
    },
    listContainer: {
        padding: 20,
        paddingTop: 10,
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontFamily: Fonts.sansBold,
        marginTop: 10,
    },
    emptySubtitle: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        marginTop: 5,
    },
    fab: {
        position: 'absolute',
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 8,
    }
});