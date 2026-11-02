# Roadmap & TODO — Amemiya Mobile App (amemiya-app)

Este documento define o plano de evolução técnica e operacional do aplicativo mobile industrial **Amemiya App (React Native / Expo)**, projetado para técnicos de campo, metrologistas e operadores de chão de fábrica.

---

## 📱 Status Atual do App
- **Stack:** Expo SDK 54, React Native 0.81, React 19, Expo Router v6, TanStack Query v5, Axios.
- **Hardware & Periféricos:** BLE (`react-native-ble-plx`), Câmera/QR Code (`expo-camera`), Gráficos (`react-native-gifted-charts`).
- **Qualidade Estática:** TypeScript 100% aprovado (`tsc --noEmit` sem erros).

---

## 🔴 Prioridade 1: Estabilização Imediata & Higiene de Código (Quick Wins)
- [ ] **Correção de Erros de ESLint (JSX Unescaped Entities):**
  - Corrigir aspas cruas em referências a `LCD 3.5"` nos arquivos:
    * `app/(app)/machines/[id].tsx`
    * `app/(app)/machines/[id]/hmi.tsx`
    * `app/(app)/machines/index.tsx`
    * `components/iot/machine-hmi-panel.tsx`
- [ ] **Limpeza de Imports Duplicados e Variáveis Órfãs:**
  - Remover imports duplicados de `react-native-safe-area-context` e variáveis não utilizadas apontadas pelo `npm run lint`.
- [ ] **Tratamento de Alinhamento com o Middleware de Tenancy:**
  - Garantir que o interceptor Axios em `services/api.ts` envie sempre o `X-Tenant-ID` dinâmico do usuário logado (já configurado, validar em todos os fluxos de query).

---

## 🟡 Prioridade 2: Metrologia Operacional & Custódia de Campo (ISO 17025)
- [ ] **Módulo de Custódia Rápida de Instrumentos (Scan & Handover):**
  - Fluxo de movimentação ágil: bipar QR Code do instrumento -> bipar QR Code do técnico ou da estação -> registrar transferência de custódia instantânea (`POST /api/v1/instruments/scan`).
- [ ] **Assinatura Eletrônica na Calibração (FDA 21 CFR Part 11):**
  - Captura de assinatura manuscrita (canvas signature) do executor ao finalizar calibração em `calibration.tsx`.
  - Re-autenticação biométrica (FaceID / TouchID / Biometria Android via `expo-local-authentication`) antes do envio.
- [ ] **Feedback Háptico e Sonoro de Medição:**
  - Emissão de bipe sonoro e haptic feedback (`expo-haptics`) diferenciado:
    * *Verde/Suave:* Leitura BLE capturada dentro do MPE.
    * *Vermelho/Forte:* Leitura fora da tolerância ou erro de comunicação.
- [ ] **Alertas em Tempo Real de MPE Excedido no Grid:**
  - Colorir instantaneamente a linha do ponto de calibração em vermelho quando o erro calculado $(\text{Leitura} - \text{Nominal})$ ultrapassar a tolerância do instrumento.

---

## 🔵 Prioridade 3: Conectividade de Campo & Bluetooth Low Energy (BLE)
- [ ] **Gerenciador de Dispositivos BLE Pareados (`app/(app)/ble-devices.tsx`):**
  - Tela dedicada para escanear, parear, testar leituras ao vivo e gerenciar instrumentos favoritos (Paquímetros Mitutoyo, Micrômetros Sylvac, Sensores Ambientais, Balanças).
- [ ] **Auto-Reconexão Silenciosa de Instrumentos:**
  - Mecanismo de retry exponencial com reconexão em background quando o instrumento BLE desliga por inatividade e é religado pelo operador.
- [ ] **Indicador de Nível de Bateria do Instrumento:**
  - Leitura da característica BLE Battery Service (`0x180F`) para exibir percentual de bateria do transceptor sem fio no topo da tela de calibração.

---

## 🟠 Prioridade 4: Operação Offline-First (Modo Sem Conexão)
- [ ] **Cache Local e Fila de Sincronização:**
  - Armazenamento local com SQLite (`expo-sqlite`) ou WatermelonDB para permitir:
    * Consulta ao catálogo de instrumentos baixados previamente;
    * Execução completa de calibrações e checagens intermediárias em áreas fabris sem sinal;
    * Fila de outbox com sincronização e resolução de conflitos ao restabelecer conectividade.
- [ ] **Indicador de Status de Rede e Pendências de Sincronização:**
  - Banner discreto no topo (`NetInfo`) indicando `"Modo Offline — 3 calibrações aguardando sincronização"`.

---

## 🟣 Prioridade 5: Chão de Fábrica, IHM & Diagnóstico Preditivo (ISO 20816)
- [ ] **Evolução do Terminal IHM LCD 3.5" (`machine-hmi-panel.tsx`):**
  - Suporte a rotação de tela com travamento em Landscape para acoplamento em suportes de máquinas industriais.
  - Alarme sonoro em caso de vibração em Zona D (Perigo - ISO 20816-3).
- [ ] **Abertura Rápida de Ordem de Serviço pelo Celular:**
  - A partir da tela da máquina ou do nó IoT, botão direto para criar Ordem de Serviço preditiva / corretiva com foto tirada na hora pela câmera.

---

## 🟢 Prioridade 6: Testes, Qualidade & CI/CD Mobile
- [ ] **Testes Unitários de Parsers BLE (Jest):**
  - Testes cobrindo decodificação de payloads Digimatic (Mitutoyo), Sylvac e Nordic UART.
- [ ] **Testes de Integração de UI (React Native Testing Library):**
  - Testes dos fluxos de Login e Seleção de Instrumentos.
- [ ] **Workflow de CI no GitHub Actions (`.github/workflows/app-ci.yml`):**
  - Execução automática de `npm run lint` e `tsc --noEmit` em PRs e pushes.
- [ ] **Configuração do EAS Build (Expo Application Services):**
  - Configuração de perfis `preview` (geração de APK direto) e `production` (Google Play / App Store).
