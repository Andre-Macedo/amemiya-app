import React, {useState, useEffect, useMemo} from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Pressable,
    KeyboardAvoidingView,
    Platform,
    Modal,
    FlatList,
    ActivityIndicator, Alert
} from 'react-native';
import {useRouter} from 'expo-router';
import {useThemeColor} from '@/hooks/use-theme-color';
import {Fonts} from '@/constants/theme';
import {Ionicons} from '@expo/vector-icons';
import {ScreenHeader} from "@/components/screen-header";
import {useInstruments} from '@/hooks/use-instruments';
import {useAvailableChecklists, useChecklistDetails} from '@/hooks/use-calibration';
import {Instrument, ChecklistItem} from '@/types/entities';
import {useBLE} from '@/hooks/use-ble';
import {SafeAreaView, useSafeAreaInsets} from "react-native-safe-area-context"; // Importe o hook criado
import {useReferenceStandards, ReferenceStandard} from '@/hooks/use-reference-standards';
import {api} from "@/services/api"; // <--- NOVO HOOK


// --- COMPONENTES AUXILIARES ---

// 1. Modal de Seleção de Instrumento com Infinite Scroll
const InstrumentSelectorModal = ({visible, onClose, onSelect}: any) => {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const bg = useThemeColor({}, 'background');
    const text = useThemeColor({}, 'text');
    const inputBg = useThemeColor({}, 'secondary');
    const primary = useThemeColor({}, 'primary');

    // Debounce
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);


    // Busca paginada
    const {
        data,
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useInstruments('Todos', debouncedSearch);

    const instruments = useMemo(() => {
        const allItems = data?.pages.flatMap(page => page.data) || [];

        // Cria um Set para rastrear IDs que já vimos
        const seen = new Set();

        return allItems.filter(item => {
            const duplicate = seen.has(item.id);
            seen.add(item.id);
            return !duplicate; // Só mantém se não for duplicata
        });
    }, [data]);

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <View style={[styles.modalContainer, {backgroundColor: bg}]}>
                <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, {color: text}]}>Selecionar Instrumento</Text>
                    <Pressable onPress={onClose} hitSlop={20}>
                        <Ionicons name="close" size={28} color={text}/>
                    </Pressable>
                </View>

                <View style={[styles.searchBox, {backgroundColor: inputBg}]}>
                    <Ionicons name="search" size={20} color="#999"/>
                    <TextInput
                        placeholder="Buscar por nome ou serial..."
                        placeholderTextColor="#999"
                        style={[styles.searchInput, {color: text}]}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {isLoading ? (
                    <ActivityIndicator style={{marginTop: 20}}/>
                ) : (
                    <FlatList
                        data={instruments}
                        keyExtractor={item => item.id}
                        renderItem={({item}) => (
                            <Pressable
                                style={[styles.modalItem, {borderBottomColor: inputBg}]}
                                onPress={() => onSelect(item)}
                            >
                                <View>
                                    <Text style={[styles.itemTitle, {color: text}]}>{item.name}</Text>
                                    <Text style={styles.itemSubtitle}>{item.stock_number}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#999"/>
                            </Pressable>
                        )}
                        onEndReached={() => {
                            if (hasNextPage) fetchNextPage();
                        }}
                        onEndReachedThreshold={0.5}
                        ListFooterComponent={isFetchingNextPage ?
                            <ActivityIndicator style={{margin: 20}} color={primary}/> : null}
                        ListEmptyComponent={
                            <Text style={{textAlign: 'center', color: '#999', marginTop: 20}}>Nenhum instrumento
                                encontrado.</Text>
                        }
                    />
                )}
            </View>
        </Modal>
    );
};

interface DynamicInputProps {
    item: ChecklistItem;
    onChange: (val: any) => void;
    value: any;
    onFocusField: (index: number) => void;

    // --- NOVAS PROPS PARA RASTREABILIDADE ---
    standards?: ReferenceStandard[]; // Lista de blocos do kit selecionado
    selectedStandardId?: number;     // Qual bloco o sistema escolheu automaticamente
    onStandardChange?: (id: string) => void;

    selectedStandardName?: string; // Nome do padrão selecionado (se houver)
    onPressStandard: () => void;   // Ação para abrir o modal de seleção
}


// 2. Componente de Input Dinâmico (Agora com suporte a múltiplas leituras)
const DynamicInput =
    ({
         item, onChange, value, onFocusField,
         standards = [], selectedStandardId, onStandardChange,
         selectedStandardName, onPressStandard
     }: DynamicInputProps) => {
        const text = useThemeColor({}, 'text');
        const textSec = useThemeColor({}, 'textSecondary');
        const inputBg = useThemeColor({}, 'secondary');
        const primary = useThemeColor({}, 'primary');
        const border = useThemeColor({}, 'border');
        const cardBg = useThemeColor({}, 'white');
        const readings = Array.isArray(value) ? value : (value ? [value] : Array(item.required_readings).fill(''));

        const handleReadingChange = (textVal: string, index: number) => {
            const newReadings = [...readings];
            newReadings[index] = textVal;
            onChange(newReadings);
        };

        if (item.question_type === 'numeric') {
            return (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, {color: textSec}]}>{item.step}</Text>

                    <Pressable
                        onPress={onPressStandard}
                        style={{
                            backgroundColor: selectedStandardName ? '#e0f2fe' : inputBg,
                            paddingHorizontal: 10, paddingVertical: 4,
                            borderRadius: 6, borderWidth: 1,
                            borderColor: selectedStandardName ? '#bae6fd' : 'transparent'
                        }}
                    >
                        <Text style={{
                            fontSize: 11,
                            color: selectedStandardName ? '#0284c7' : textSec,
                            fontWeight: '600'
                        }}>
                            {selectedStandardName ? `Ref: ${selectedStandardName}` : 'Vincular Padrão +'}
                        </Text>
                    </Pressable>

                    {Array.from({length: item.required_readings}).map((_, index) => (
                        <View key={index} style={{marginBottom: 10}}>
                            {item.required_readings > 1 && (
                                <Text style={{fontSize: 12, color: primary, marginBottom: 4}}>
                                    Leitura {index + 1}
                                </Text>
                            )}

                            <View style={[styles.inputContainer, {backgroundColor: inputBg, flex: 1}]}>
                                <TextInput
                                    style={[styles.input, {color: text}]}
                                    placeholder="0.00"
                                    placeholderTextColor={textSec}
                                    keyboardType="numeric"
                                    value={readings[index] || ''}
                                    onChangeText={(val) => handleReadingChange(val, index)}
                                    onFocus={() => onFocusField(index)}
                                />
                            </View>
                        </View>
                    ))}
                </View>
            );
        }

        if (item.question_type === 'boolean') {
            const isApproved = value === 'approved';
            return (
                <View style={styles.inputGroup}>
                    <Text style={[styles.label, {color: textSec}]}>{item.step}</Text>
                    <View style={{flexDirection: 'row', gap: 10}}>
                        <Pressable
                            onPress={() => onChange('approved')}
                            style={[styles.boolBtn, {backgroundColor: isApproved ? '#34C759' : inputBg}]}
                        >
                            <Text style={{color: isApproved ? '#FFF' : text, fontWeight: '600'}}>Aprovado</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onChange('rejected')}
                            style={[styles.boolBtn, {backgroundColor: value === 'rejected' ? '#FF3B30' : inputBg}]}
                        >
                            <Text style={{
                                color: value === 'rejected' ? '#FFF' : text,
                                fontWeight: '600'
                            }}>Reprovado</Text>
                        </Pressable>
                    </View>
                </View>
            );
        }

        if (item.question_type === 'header') {
            return (
                <View style={{
                    marginTop: 16,
                    marginBottom: 8,
                    paddingBottom: 4,
                    borderBottomWidth: 1,
                    borderBottomColor: border
                }}>
                    <Text style={{fontSize: 18, fontFamily: Fonts.sansBold, color: primary}}>{item.step}</Text>
                </View>
            );
        }

        // Default: Text
        return (
            <View style={styles.inputGroup}>
                <Text style={[styles.label, {color: textSec}]}>{item.step}</Text>
                <View style={[styles.inputContainer, {backgroundColor: inputBg, height: 80, alignItems: 'flex-start'}]}>
                    <TextInput
                        style={[styles.input, {color: text, height: '100%', textAlignVertical: 'top', paddingTop: 12}]}
                        multiline
                        value={value}
                        onChangeText={onChange}
                        placeholder="Digite aqui..."
                        placeholderTextColor={textSec}
                    />
                </View>
            </View>
        );
    };

export default function CalibrationScreen() {
    const router = useRouter();

    // Estados
    const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [selectedKitId, setSelectedKitId] = useState<number | null>(null); // <--- NOVO
    const [selectingStandardForId, setSelectingStandardForId] = useState<string | null>(null);

    const [itemStandards, setItemStandards] = useState<Record<string, number>>({});
    const [answers, setAnswers] = useState<Record<string, any>>({}); // Agora pode guardar array


    const [envData, setEnvData] = useState({temperature: '', humidity: ''});
    const [finalResult, setFinalResult] = useState<'approved' | 'rejected' | 'approved_with_restrictions'>('approved');
    const [notes, setNotes] = useState('');

    const {kits, allStandards, isLoading} = useReferenceStandards();
    const {scanAndConnect, connectionStatus, lastValue, isConnected} = useBLE();

    const [modalVisible, setModalVisible] = useState(false);
    const [focusedField, setFocusedField] = useState<{ itemId: string, index: number } | null>(null);
    const [kitModalVisible, setKitModalVisible] = useState(false); // Novo estado para modal de kit

    const [standardSearch, setStandardSearch] = useState('');


    const insets = useSafeAreaInsets();

    const {data: availableChecklists, isLoading: loadingList} = useAvailableChecklists(selectedInstrument?.id);
    const {data: checklistTemplate, isLoading: loadingForm} = useChecklistDetails(selectedTemplateId || undefined);


    useEffect(() => {
        if (!isConnected) {
            scanAndConnect();
        }
    }, []);

    // Quando o pedal envia um valor (lastValue muda)
    useEffect(() => {
        if (lastValue && focusedField) {
            console.log(`Pedal acionado! Valor: ${lastValue} -> Campo: ${focusedField.itemId} [${focusedField.index}]`);

            // Atualiza a resposta no campo focado automaticamente
            handleUpdateAnswer(focusedField.itemId, focusedField.index, lastValue);

            // Dica de UX: Não remova o foco. O usuário pode querer pisar de novo para corrigir.
            // O teclado continua aberto e o valor atualiza.
        }
    }, [lastValue]); // Roda sempre que o ESP32 manda um valor novo

    useEffect(() => {
        if (selectedKitId && checklistTemplate && kits) {
            const kit = kits.find(k => k.id === selectedKitId);
            if (!kit || !kit.children) return;

            const newMapping: Record<string, string> = {};

            checklistTemplate.items.forEach(item => {
                if (item.question_type === 'numeric') {
                    // Extrai número do step se nominal_value não vier da API (fallback regex simples)
                    // No seu PHP: (float) preg_replace('/[^0-9.]/', '', $item->step)
                    const nominalRequired = item.nominal_value || parseFloat(item.step.replace(/[^0-9.]/g, ''));

                    if (!isNaN(nominalRequired)) {
                        // Procura no kit um bloco com valor próximo (tolerância 0.001)
                        const match = kit.children?.find(child =>
                            Math.abs((child.nominal_value || 0) - nominalRequired) < 0.001
                        );

                        if (match) {
                            newMapping[item.id] = match.id;
                        }
                    }
                }
            });

            console.log("Auto-Match Realizado:", newMapping);
            setItemStandards(newMapping);
        }
    }, [selectedKitId, checklistTemplate, kits]);


    // Hooks

    // Cores
    const bg = useThemeColor({}, 'background');
    const cardBgColor = useThemeColor({}, 'white');
    const text = useThemeColor({}, 'text');
    const primary = useThemeColor({}, 'primary');
    const border = useThemeColor({}, 'border');
    const textSec = useThemeColor({}, 'textSecondary');
    const inputBg = useThemeColor({}, 'secondary');

    // Helper para achar o kit selecionado
    const selectedKit = useMemo(() => kits?.find(k => k.id === selectedKitId), [kits, selectedKitId]);

    // Função auxiliar para atualizar resposta (refatorada para usar no BLE também)
    const handleUpdateAnswer = (itemId: string, index: number, val: string) => {
        setAnswers(prev => {
            const currentVal = prev[itemId] || [];
            const readingsArray = Array.isArray(currentVal) ? [...currentVal] : [];
            readingsArray[index] = val;
            return {...prev, [itemId]: readingsArray};
        });
    };

    const handleManualStandardSelect = (standardId: number) => {
        if (selectingStandardForId) {
            setItemStandards(prev => ({
                ...prev,
                [selectingStandardForId]: standardId
            }));
            setSelectingStandardForId(null); // Fecha modal
        }
    };

    const handleSelectInstrument = (inst: Instrument) => {
        setSelectedInstrument(inst);
        setSelectedTemplateId(null);
        setAnswers({});
        setModalVisible(false);
    };

    // const handleBluetoothRead = (itemId: string, readingIndex: number = 0) => {
    //     if (!isConnected) {
    //         alert("Bluetooth desconectado! Conectando...");
    //         scanAndConnect();
    //         return;
    //     }
    //
    //     // "Arma" o campo para receber o próximo valor do pedal
    //     setActiveField({ itemId, index: readingIndex });
    //     // Feedback visual simples (pode melhorar com Toast)
    //     console.log(`Aguardando pedal para o item ${itemId} index ${readingIndex}...`);
    // };

    const handleSave = async () => {
        // Validação de ambiente
        if (!envData.temperature || !envData.humidity) {
            Alert.alert("Dados Ambientais", "Por favor preencha temperatura e umidade.");
            return;
        }

        // --- LÓGICA DE FORMATAÇÃO INTELIGENTE ---
        const itemsPayload = checklistTemplate?.items.map(item => {
            const rawAnswer = answers[item.id];

            // Objeto base
            const payloadItem: any = {
                item_id: item.id,
                readings: null,
                result: null,
                notes: null,
                reference_standard_id: null
            };

            // Se não tiver resposta, manda nulo (ou ignora se preferir)
            if (rawAnswer === undefined || rawAnswer === null) return payloadItem;

            // Formatação baseada no TIPO da pergunta
            switch (item.question_type) {
                case 'numeric':
                    // Para numérico: readings é array, reference_standard_id é obrigatório
                    payloadItem.readings = Array.isArray(rawAnswer) ? rawAnswer : [rawAnswer];
                    payloadItem.reference_standard_id = itemStandards[item.id] || null;
                    break;

                case 'boolean':
                    // Para booleano: readings é null, result recebe 'approved'/'rejected'
                    payloadItem.result = rawAnswer; // Espera-se string 'approved' ou 'rejected'
                    break;

                case 'text':
                    // Para texto: readings é null, notes recebe o texto
                    payloadItem.notes = rawAnswer;
                    break;
            }

            return payloadItem;
        }) || [];

        // Montagem do Payload Final
        const payload = {
            instrument_id: selectedInstrument?.id,
            checklist_template_id: selectedTemplateId,
            calibration_date: new Date().toISOString().split('T')[0],
            result: finalResult,
            environment: {
                temperature: parseFloat(envData.temperature),
                humidity: parseFloat(envData.humidity)
            },
            deviation: 0, // Implementar cálculo se desejar
            uncertainty: 0,
            notes: notes, // Observações gerais da calibração
            items: itemsPayload // Array formatado corretamente
        };

        try {
            // Envia para o backend
            const response = await api.post('/metrology/calibrations', payload);

            // Alert.alert("Sucesso", "Calibração finalizada!");

            // O backend deve retornar o ID da calibração criada
            if (response.data && response.data.id) {
                // Removemos o histórico para o usuário não voltar para o form com 'Back'
                router.replace({
                    pathname: '/calibration-details/[calibrationId]',
                    params: {calibrationId: response.data.id}
                });
            } else {
                router.back(); // Fallback
            }

        } catch (error) {
            Alert.alert("Erro", "Falha ao enviar calibração.");
            console.error(error);
        }
    };

    const filteredStandards = useMemo(() => {
        if (!standardSearch) return allStandards;
        const lower = standardSearch.toLowerCase();
        return allStandards?.filter(s =>
            s.name.toLowerCase().includes(lower) ||
            s.nominal_value?.toString().includes(lower) ||
            s.effective_stock_number?.toLowerCase().includes(lower)
        );
    }, [allStandards, standardSearch]);


    return (

        <View style={{flex: 1, backgroundColor: bg}}>
            <ScreenHeader
                title="Nova Calibração"
                showBack
                rightIcon={isConnected ? "bluetooth" : "bluetooth-outline"}
                rightAction={isConnected ? () => {
                } : scanAndConnect} // Clica para reconectar se caiu
                rightColor={isConnected ? "#007AFF" : "#999"}
            />

            {/* Barra de Status (Só aparece se estiver desconectado ou escaneando para dar feedback) */}
            {!isConnected && (
                <View style={{backgroundColor: '#FF950022', padding: 8, alignItems: 'center'}}>
                    <Text style={{color: '#FF9500', fontSize: 12}}>
                        Status Bluetooth: {connectionStatus} (Toque no ícone para conectar)
                    </Text>
                </View>
            )}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{flex: 1}}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} // Ajuste se tiver Header muito grande
            >

                <ScrollView
                    contentContainerStyle={{
                        padding: 20,
                        // DÁ ESPAÇO PARA OS ULTIMOS INPUTS SUBIREM (Altura do footer + folga)
                        paddingBottom: 100
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* PASSO 1: Instrumento */}
                    <Text style={[styles.sectionTitle, {color: text}]}>1. Instrumento</Text>
                    <Pressable
                        style={[styles.selectorBox, {backgroundColor: cardBgColor, borderColor: border}]}
                        onPress={() => setModalVisible(true)}
                    >
                        <View style={{flex: 1}}>
                            <Text style={[styles.selectorLabel, {color: textSec}]}>Selecionado</Text>
                            <Text style={[styles.selectorValue, {color: selectedInstrument ? text : textSec}]}>
                                {selectedInstrument ? selectedInstrument.name : 'Toque para buscar...'}
                            </Text>
                            {selectedInstrument && <Text
                                style={{fontSize: 12, color: primary}}>S/N: {selectedInstrument.stock_number}</Text>}
                        </View>
                        <Ionicons name="chevron-down" size={24} color={textSec}/>
                    </Pressable>

                    {/* PASSO 2: Seleção de Procedimento */}
                    {selectedInstrument && (
                        <View style={{marginTop: 24}}>
                            <Text style={[styles.sectionTitle, {color: text}]}>2. Procedimento</Text>

                            {loadingList ? (
                                <ActivityIndicator color={primary} style={{alignSelf: 'flex-start'}}/>
                            ) : availableChecklists && availableChecklists.length > 0 ? (
                                <View style={styles.proceduresContainer}>
                                    {availableChecklists.map((proc) => {
                                        const isSelected = selectedTemplateId === proc.id;
                                        return (
                                            <Pressable
                                                key={proc.id}
                                                onPress={() => setSelectedTemplateId(proc.id)}
                                                style={[
                                                    styles.procedureCard,
                                                    {
                                                        backgroundColor: isSelected ? primary + '15' : cardBgColor,
                                                        borderColor: isSelected ? primary : border
                                                    }
                                                ]}
                                            >
                                                <View style={{flex: 1}}>
                                                    <Text
                                                        style={[styles.procName, {color: isSelected ? primary : text}]}>{proc.name}</Text>
                                                    <Text style={{fontSize: 12, color: textSec}}>Padrão ISO</Text>
                                                </View>
                                                {isSelected &&
                                                    <Ionicons name="checkmark-circle" size={24} color={primary}/>}
                                            </Pressable>
                                        );
                                    })}
                                </View>
                            ) : (
                                <Text style={{color: textSec, fontStyle: 'italic'}}>Nenhum procedimento encontrado para
                                    este tipo de instrumento.</Text>
                            )}
                        </View>
                    )}

                    {/* 3. SELEÇÃO DE KIT (Só aparece se tiver procedimento selecionado) */}
                    {selectedTemplateId && (
                        <View style={{marginTop: 20}}>
                            <Text style={[styles.sectionTitle, {color: text}]}>3. Padrões de Referência</Text>
                            <Text style={[styles.label, {color: textSec, marginBottom: 8}]}>Selecione o Kit utilizado
                                para rastreabilidade:</Text>

                            <Pressable
                                style={[styles.selectorBox, {backgroundColor: cardBgColor, borderColor: border}]}
                                onPress={() => setKitModalVisible(true)}
                            >
                                <View style={{flex: 1}}>
                                    <Text style={[styles.selectorValue, {color: selectedKitId ? text : textSec}]}>
                                        {selectedKitId
                                            ? kits?.find(k => k.id === selectedKitId)?.name
                                            : 'Toque para selecionar um kit...'}
                                    </Text>
                                </View>
                                <Ionicons name="chevron-down" size={24} color={textSec}/>
                            </Pressable>
                        </View>
                    )}

                    {selectedTemplateId && checklistTemplate && (
                        <View style={{marginTop: 20}}>
                            <Text style={[styles.sectionTitle, {color: text, marginBottom: 16}]}>4. Medições</Text>
                            <View style={[styles.formCard, {backgroundColor: cardBgColor}]}>

                                {checklistTemplate.items.map((item) => {
                                    const stdId = itemStandards[item.id];

                                    let std = allStandards?.find(s => s.id === stdId);

                                    const stdName = (std?.name ?? 'Bloco') + ' ' + (std?.effective_stock_number ?? 'SRL - 0000');

                                    return (
                                        <DynamicInput
                                            key={item.id}
                                            item={item}
                                            value={answers[item.id]}
                                            onChange={(val) => setAnswers(prev => ({...prev, [item.id]: val}))}
                                            onFocusField={(index) => setFocusedField({itemId: item.id, index})}

                                            selectedStandardName={stdName}
                                            onPressStandard={() => setSelectingStandardForId(item.id)}
                                        />
                                    );
                                })}
                            </View>
                        </View>

                    )}

                    {/*/!* PASSO 3: Preenchimento *!/*/}
                    {/*{selectedTemplateId && (*/}
                    {/*    <View style={{marginTop: 24}}>*/}
                    {/*        <Text style={[styles.sectionTitle, {color: text}]}>3. Coleta de Dados</Text>*/}

                    {/*        {loadingForm ? (*/}
                    {/*            <ActivityIndicator color={primary}/>*/}
                    {/*        ) : checklistTemplate ? (*/}
                    {/*            <View style={[styles.formCard, {backgroundColor: cardBgColor}]}>*/}
                    {/*                {checklistTemplate.items.map((item) => (*/}
                    {/*                    <DynamicInput*/}
                    {/*                        key={item.id}*/}
                    {/*                        item={item}*/}
                    {/*                        value={answers[item.id]}*/}
                    {/*                    //     standards=[], selectedStandardId, onStandardChange*/}
                    {/*                    onChange={(val) => setAnswers(prev => ({...prev, [item.id]: val}))}*/}
                    {/*                    // AQUI: Quando o usuário toca no input, guardamos quem é ele*/}
                    {/*                    onFocusField={(index) => {*/}
                    {/*                    setFocusedField({itemId: item.id, index});*/}
                    {/*                }}*/}
                    {/*                    />*/}
                    {/*                    ))}*/}
                    {/*            </View>*/}
                    {/*        ) : null}*/}
                    {/*    </View>*/}
                    {/*)}*/}

                    {/* 4. DADOS FINAIS (AMBIENTE E RESULTADO) */}
                    {selectedTemplateId && (
                        <View style={{marginTop: 20}}>
                            <Text style={[styles.sectionTitle, {color: text}]}>5. Condições & Resultado</Text>

                            <View style={[styles.formCard, {backgroundColor: cardBgColor}]}>

                                <View style={{flexDirection: 'row', gap: 10}}>
                                    <View style={{flex: 1, width: 50}}>
                                        <Text style={[styles.label, {color: textSec}]}>Temp (°C)</Text>
                                        <View style={[styles.inputContainer, {backgroundColor: inputBg}]}>
                                            <TextInput
                                                style={[styles.input, {color: text}]} // Removeu backgroundColor daqui
                                                keyboardType="numeric"
                                                placeholder="20.0"
                                                placeholderTextColor={textSec}
                                                value={envData.temperature}
                                                onChangeText={t => setEnvData(prev => ({...prev, temperature: t}))}
                                            />
                                        </View>
                                    </View>

                                    <View style={{flex: 1, width: 50}}>
                                        <Text style={[styles.label, {color: textSec}]}>Umid (%)</Text>
                                        <View style={[styles.inputContainer, {backgroundColor: inputBg}]}>
                                            <TextInput
                                                style={[styles.input, {color: text}]} // Removeu backgroundColor daqui
                                                keyboardType="numeric"
                                                placeholder="50"
                                                placeholderTextColor={textSec}
                                                value={envData.humidity}
                                                onChangeText={t => setEnvData(prev => ({...prev, humidity: t}))}
                                            />
                                        </View>
                                    </View>
                                </View>

                                <View style={{marginTop: 10}}>
                                    <Text style={[styles.label, {color: textSec}]}>Observações</Text>
                                    <View style={[styles.inputContainer, {
                                        backgroundColor: inputBg,
                                        height: 80,
                                        alignItems: 'flex-start'
                                    }]}>
                                        <TextInput
                                            style={[styles.input, {
                                                color: text,
                                                height: '100%',
                                                textAlignVertical: 'top',
                                                paddingTop: 12
                                            }]}
                                            multiline
                                            value={notes}
                                            onChangeText={setNotes}
                                            placeholder="Digite aqui..."
                                            placeholderTextColor={textSec}
                                        />
                                    </View>
                                </View>


                                <Text style={[styles.label, {color: textSec, marginTop: 10}]}>Parecer Final</Text>
                                <View style={{flexDirection: 'row', gap: 8, marginTop: 5}}>
                                    <View style={{flex: 1, width: 50}}>
                                        <Pressable
                                            style={[styles.submitButton,
                                                {backgroundColor: finalResult === 'approved' ? '#22c55e' : inputBg},
                                            ]}
                                            onPress={() => setFinalResult('approved')}
                                        >
                                            <Text
                                                style={{color: finalResult === 'approved' ? '#fff' : text}}>Aprovado</Text>
                                        </Pressable>
                                    </View>

                                    <View style={{flex: 1, width: 50}}>
                                        <Pressable
                                            style={[styles.submitButton,
                                                {backgroundColor: finalResult === 'rejected' ? '#ef4444' : inputBg},
                                            ]}
                                            onPress={() => setFinalResult('rejected')}
                                        >
                                            <Text
                                                style={{color: finalResult === 'rejected' ? '#fff' : text}}>Reprovado</Text>
                                        </Pressable>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                </ScrollView>

                {/* Footer */}
                <View style={[
                    styles.footer,
                    {
                        backgroundColor: cardBgColor,
                        borderTopColor: border,
                        // Mantém seu ajuste de safe area
                        paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 20
                    }
                ]}>
                    <Pressable
                        style={[
                            styles.submitButton,
                            {
                                backgroundColor: (selectedTemplateId && !loadingForm) ? primary : border,
                                opacity: (selectedTemplateId && !loadingForm) ? 1 : 0.5
                            }
                        ]}
                        onPress={handleSave}
                        disabled={!selectedTemplateId || loadingForm}
                    >
                        <Text style={styles.submitText}>Finalizar</Text>
                        <Ionicons name="checkmark-circle-outline" size={24} color="#FFF"/>
                    </Pressable>
                </View>


            </KeyboardAvoidingView>
            <InstrumentSelectorModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelect={handleSelectInstrument}
            />

            <Modal visible={kitModalVisible} animationType="slide" transparent>
                <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}>
                    <View style={{
                        backgroundColor: bg,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        maxHeight: '50%',
                        paddingBottom: 5 + insets.bottom,
                    }}>
                        <View style={{
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: border,
                            flexDirection: 'row',
                            justifyContent: 'space-between'
                        }}>
                            <Text style={{fontSize: 18, fontWeight: 'bold', color: text}}>Selecionar Kit</Text>
                            <Pressable onPress={() => setKitModalVisible(false)}>
                                <Ionicons name="close" size={24} color={text}/>
                            </Pressable>
                        </View>
                        <FlatList
                            data={kits}
                            keyExtractor={item => item.id.toString()}
                            renderItem={({item}) => (
                                <Pressable
                                    style={{padding: 16, borderBottomWidth: 1, borderBottomColor: border}}
                                    onPress={() => {
                                        setSelectedKitId(item.id);
                                        setKitModalVisible(false);
                                    }}
                                >
                                    <Text style={{fontSize: 16, color: text}}>{item.name}</Text>
                                    <Text style={{
                                        fontSize: 12,
                                        color: textSec
                                    }}>{item.children?.length || 0} blocos</Text>
                                </Pressable>
                            )}
                        />
                    </View>
                </View>
            </Modal>

            {/* --- MODAL DE SELEÇÃO MANUAL (Agora com Busca e Lista Completa) --- */}
            <Modal visible={!!selectingStandardForId} animationType="slide" transparent>
                <View style={{flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end'}}>
                    <View
                        style={{
                            backgroundColor: bg,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                            height: '80%',
                            paddingBottom: 5 + insets.bottom
                        }}
                    >

                        <View style={{padding: 16, borderBottomWidth: 1, borderBottomColor: border}}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 10
                            }}>
                                <Text style={{fontSize: 18, fontWeight: 'bold', color: text}}>Selecionar Padrão</Text>
                                <Pressable onPress={() => {
                                    setSelectingStandardForId(null);
                                    setStandardSearch(''); // Limpa busca ao fechar
                                }}>
                                    <Ionicons name="close" size={24} color={text}/>
                                </Pressable>
                            </View>

                            {/* Campo de Busca Rápida */}
                            <View style={{
                                backgroundColor: inputBg,
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 10,
                                borderRadius: 8,
                                height: 40
                            }}>
                                <Ionicons name="search" size={18} color={textSec}/>
                                <TextInput
                                    style={{flex: 1, marginLeft: 8, color: text}}
                                    placeholder="Buscar por valor (ex: 10) ou nome..."
                                    placeholderTextColor={textSec}
                                    value={standardSearch}
                                    onChangeText={setStandardSearch}
                                />
                            </View>
                        </View>

                        {/* Botão de Remover Vínculo */}
                        <Pressable
                            style={{
                                padding: 16,
                                borderBottomWidth: 1,
                                borderBottomColor: border,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}
                            onPress={() => {
                                if (selectingStandardForId) {
                                    const newStds = {...itemStandards};
                                    delete newStds[selectingStandardForId];
                                    setItemStandards(newStds);
                                    setSelectingStandardForId(null);
                                }
                            }}
                        >
                            <Ionicons name="trash-outline" size={20} color="red" style={{marginRight: 10}}/>
                            <Text style={{color: 'red'}}>Remover/Limpar Padrão desta linha</Text>
                        </Pressable>

                        <FlatList
                            data={filteredStandards}
                            keyExtractor={item => item.id.toString()}
                            initialNumToRender={20}
                            renderItem={({item}) => (
                                <Pressable
                                    style={{padding: 16, borderBottomWidth: 1, borderBottomColor: border}}
                                    onPress={() => handleManualStandardSelect(item.id)}
                                >
                                    <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                        <Text style={{fontSize: 16, color: text, fontWeight: '600'}}>{item.name}</Text>
                                        <Text style={{fontSize: 16, color: primary, fontWeight: 'bold'}}>
                                            {Number(item.nominal_value)} mm
                                        </Text>
                                    </View>
                                    <View style={{flexDirection: 'row', marginTop: 4}}>
                                        <Text style={{fontSize: 12, color: textSec, marginRight: 10}}>
                                            S/N: {item.effective_stock_number || 'N/A'}
                                        </Text>
                                        {/* Mostra se pertence a algum kit (se tivermos essa info no nome ou parent) */}
                                    </View>
                                </Pressable>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {flex: 1},
    content: {padding: 20, paddingBottom: 20},
    sectionTitle: {fontSize: 16, fontFamily: Fonts.sansBold, marginBottom: 12},

    // Selector
    selectorBox: {flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1},
    selectorLabel: {fontSize: 12, fontFamily: Fonts.sans, marginBottom: 4},
    selectorValue: {fontSize: 16, fontFamily: Fonts.sansSemiBold},

    // Procedures
    proceduresContainer: {gap: 10},
    procedureCard: {flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1},
    procName: {fontSize: 16, fontFamily: Fonts.sansSemiBold, marginBottom: 2},

    // Form
    formCard: {padding: 20, borderRadius: 16, gap: 20},
    inputGroup: {},
    label: {fontSize: 14, fontFamily: Fonts.sansSemiBold, marginBottom: 8},
    inputContainer: {height: 50, borderRadius: 12, paddingHorizontal: 16, justifyContent: 'center'},
    input: {fontSize: 16, fontFamily: Fonts.sans},

    // Bluetooth Button Visual
    bluetoothButton: {
        width: 50, height: 50, borderRadius: 12,
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1
    },

    boolBtn: {flex: 1, height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center'},

    // Footer
    footer: {padding: 20, borderTopWidth: 1,},
    submitButton: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        elevation: 4
    },
    submitText: {color: '#FFF', fontSize: 18, fontFamily: Fonts.sansBold},

    // Modal
    modalContainer: {flex: 1, paddingTop: 20},
    modalHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20},
    modalTitle: {fontSize: 20, fontFamily: Fonts.sansBold},
    searchBox: {flexDirection: 'row', alignItems: 'center', margin: 20, marginTop: 0, padding: 12, borderRadius: 12},
    searchInput: {flex: 1, marginLeft: 10, fontSize: 16, height: 44},
    modalItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1
    },
    itemTitle: {fontSize: 16, fontFamily: Fonts.sansSemiBold},
    itemSubtitle: {fontSize: 14, color: '#999'}
});