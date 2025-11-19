import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter, Link } from 'expo-router';
import { DUMMY_INSTRUMENTS } from '@/data/dummyData';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Fonts } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Calibration } from '@/types/entities';

export default function InstrumentHistoryScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();

    const instrument = DUMMY_INSTRUMENTS.find(inst => inst.id === id);
    const bgColor = useThemeColor({}, 'background');
    const cardBg = useThemeColor({}, 'white');
    const textColor = useThemeColor({}, 'text');
    const successColor = useThemeColor({}, 'success');

    if (!instrument || !instrument.calibrations) return null;

    console.log(id)

    const renderCalibrationItem = ({ item }: { item: Calibration }) => (
        <Pressable
            onPress={() => {
                router.push(`/calibration-details/${item.id}`);
            }}
            style={({ pressed }) => [
                styles.itemContainer,
                { backgroundColor: cardBg },
                pressed && { opacity: 0.7 }
            ]}
        >
            <View style={styles.itemHeader}>
                <Text style={[styles.dateText, { color: textColor }]}>
                    {item.calibration_date}
                </Text>
                <Text style={[styles.statusText, { color: item.result === 'Aprovado' ? successColor : 'red' }]}>
                    {item.result}
                </Text>
            </View>
            <Text style={[styles.techText, { color: textColor }]}>
                Técnico: {item.performed_by}
            </Text>
            <Ionicons name="chevron-forward-outline" size={24} color={textColor} style={styles.icon} />
        </Pressable>
    );

    return (
        <View style={[styles.container, { backgroundColor: bgColor }]}>
            <FlatList
                data={instrument.calibrations}
                keyExtractor={(item) => item.id}
                renderItem={renderCalibrationItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10 },
    listContent: { paddingBottom: 20 },
    itemContainer: {
        padding: 15,
        marginVertical: 5,
        borderRadius: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 2,
    },
    itemHeader: {
        flex: 1,
        marginRight: 10,
    },
    dateText: {
        fontSize: 16,
        fontFamily: Fonts.sansSemiBold,
    },
    techText: {
        fontSize: 14,
        fontFamily: Fonts.sans,
        marginTop: 4,
    },
    statusText: {
        fontSize: 14,
        fontFamily: Fonts.sansBold,
    },
    icon: {
        marginLeft: 10,
    }
});