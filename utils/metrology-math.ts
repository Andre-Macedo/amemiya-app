/**
 * Metrology Math Domain Module
 * Funções puras de cálculo metrológico conforme ISO/IEC Guide 98-3 (GUM) e ILAC-G8:09/2019.
 */

export interface ConformityResult {
    status: 'pass' | 'fail' | 'conditional_pass' | 'conditional_fail';
    ruleApplied: 'ilac_g8_simple' | 'ilac_g8_guardband';
    acceptanceInterval: {
        lower: number;
        upper: number;
    };
    guardband: number;
    description: string;
}

/**
 * Calcula a média aritmética de um array de leituras.
 */
export function calculateMean(readings: number[]): number {
    if (!readings || readings.length === 0) return 0;
    const sum = readings.reduce((acc, val) => acc + val, 0);
    return sum / readings.length;
}

/**
 * Calcula o desvio máximo encontrado em relação a um valor nominal.
 * Desvio = Média(leituras) - Valor Nominal.
 */
export function calculateMaxDeviation(readings: number[], nominalValue: number): number {
    if (!readings || readings.length === 0) return 0;
    const mean = calculateMean(readings);
    return parseFloat((mean - nominalValue).toFixed(6));
}

/**
 * Calcula a histerese entre medições no sentido direto (ida/forward) e reverso (volta/reverse).
 */
export function calculateHysteresis(forwardReadings: number[], reverseReadings: number[]): number {
    if (!forwardReadings.length || !reverseReadings.length) return 0;
    const forwardMean = calculateMean(forwardReadings);
    const reverseMean = calculateMean(reverseReadings);
    return parseFloat(Math.abs(forwardMean - reverseMean).toFixed(6));
}

/**
 * Avalia a conformidade metrológica segundo as regras de decisão ILAC-G8:09/2019.
 *
 * @param deviation Desvio/erro medido no ponto
 * @param uncertainty Inerteza expandida U (k=2, 95.45%)
 * @param tolerancePlus Limite superior de especificação (ex: +0.02)
 * @param toleranceMinus Limite inferior de especificação (ex: -0.02)
 * @param rule 'ilac_g8_simple' (aceitação binária) ou 'ilac_g8_guardband' (com zona de guarda w = U)
 */
export function evaluateConformity(
    deviation: number,
    uncertainty: number,
    tolerancePlus: number,
    toleranceMinus: number,
    rule: 'ilac_g8_simple' | 'ilac_g8_guardband' = 'ilac_g8_guardband'
): ConformityResult {
    const u = Math.abs(uncertainty);
    const tolSup = Math.max(tolerancePlus, toleranceMinus);
    const tolInf = Math.min(tolerancePlus, toleranceMinus);

    if (rule === 'ilac_g8_simple') {
        const isPass = deviation <= tolSup && deviation >= tolInf;
        return {
            status: isPass ? 'pass' : 'fail',
            ruleApplied: 'ilac_g8_simple',
            acceptanceInterval: { lower: tolInf, upper: tolSup },
            guardband: 0,
            description: isPass ? 'Aprovado (Aceitação Simples)' : 'Reprovado (Fora da Tolerância)',
        };
    }

    // ILAC-G8 com Guardband (w = U)
    const guardband = u;
    const acceptUpper = tolSup - guardband;
    const acceptLower = tolInf + guardband;

    if (deviation <= acceptUpper && deviation >= acceptLower) {
        return {
            status: 'pass',
            ruleApplied: 'ilac_g8_guardband',
            acceptanceInterval: { lower: acceptLower, upper: acceptUpper },
            guardband,
            description: 'Aprovado dentro da Zona de Aceitação Segura (PFA < 2.5%)',
        };
    }

    if (deviation > tolSup || deviation < tolInf) {
        return {
            status: 'fail',
            ruleApplied: 'ilac_g8_guardband',
            acceptanceInterval: { lower: acceptLower, upper: acceptUpper },
            guardband,
            description: 'Reprovado fora da Zona de Tolerância (Rejeição Segura)',
        };
    }

    return {
        status: 'conditional_pass',
        ruleApplied: 'ilac_g8_guardband',
        acceptanceInterval: { lower: acceptLower, upper: acceptUpper },
        guardband,
        description: 'Faixa Indeterminada / Aceitação Condicional (Zona de Guarda)',
    };
}
