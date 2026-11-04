# Roadmap & TODO — Amemiya Mobile App (amemiya-app)

Este documento define o plano de evolução técnica e operacional do aplicativo mobile industrial **Amemiya App (React Native / Expo)**, projetado para técnicos de campo, metrologistas e operadores de chão de fábrica.

---

## 📱 Status Atual do App
- **Stack:** Expo SDK 54, React Native 0.81, React 19, Expo Router v6, TanStack Query v5, Axios.
- **Hardware & Periféricos:** BLE (`react-native-ble-plx`), Câmera/QR Code (`expo-camera`), Gráficos (`react-native-gifted-charts`).
- **Qualidade Estática:** TypeScript 100% aprovado (`tsc --noEmit` sem erros).

---

## 🔴 Prioridade 1: Estabilização Imediata & Higiene de Código (Quick Wins)
- [x] **Correção de Erros de ESLint (JSX Unescaped Entities):**
  - Corrigido aspas cruas em referências a `LCD 3.5"` nos arquivos:
    * `app/(app)/machines/[id].tsx`
    * `app/(app)/machines/[id]/hmi.tsx`
    * `app/(app)/machines/index.tsx`
    * `components/iot/machine-hmi-panel.tsx`
- [x] **Limpeza de Imports Duplicados e Variáveis Órfãs:**
  - Removidos imports duplicados e todas as variáveis não utilizadas apontadas pelo `npm run lint` (0 erros, 0 warnings).
- [x] **Tratamento de Alinhamento com o Middleware de Tenancy:**
  - Interceptor Axios em `services/api.ts` envia dinamicamente o `X-Tenant-ID` do usuário autenticado.

---

## 🟡 Prioridade 2: Metrologia Operacional & Custódia de Campo (ISO 17025)
- [x] **Módulo de Custódia Rápida de Instrumentos (Scan & Handover):**
  - Modo dedicado no scanner (`scanner.tsx`): bipar QR Code do instrumento -> selecionar posto/estação -> registrar movimentação via `POST /api/v1/instruments/scan`.
- [x] **Assinatura Eletrônica na Calibração (FDA 21 CFR Part 11):**
  - Re-autenticação biométrica (FaceID / TouchID / Biometria Android via `expo-local-authentication`) ou senha do operador para selar a calibração com timestamp e hash.
- [x] **Feedback Háptico e Sonoro de Medição:**
  - Emissão de haptic feedback (`expo-haptics`) diferenciado na captura BLE e ao exceder tolerância.
- [x] **Alertas em Tempo Real de MPE Excedido no Grid:**
  - Destaque em vermelho e vibração instantânea quando o desvio $(\text{Leitura} - \text{Nominal})$ ultrapassa o MPE do instrumento.

---

## 🔵 Prioridade 3: Conectividade de Campo & Bluetooth Low Energy (BLE)
- [x] **Gerenciador de Dispositivos BLE Pareados (`app/(app)/ble-devices.tsx`):**
  - Tela dedicada com escaneamento, conexão por driver (Mitutoyo, Sylvac, Nordic UART, Genérico), gerenciamento de favoritos e preview ao vivo.
- [x] **Auto-Reconexão Silenciosa de Instrumentos:**
  - Listener de desconexão com retry automático em background ao religar o instrumento.
- [x] **Indicador de Nível de Bateria do Instrumento:**
  - Leitura do BLE Battery Service (`0x180F` / `0x2A19`) e exibição no topo da tela de calibração e no gerenciador BLE.

---

## 🟠 Prioridade 4: Operação Offline-First (Modo Sem Conexão)
- [x] **Cache Local e Fila de Sincronização:**
  - Armazenamento local com AsyncStorage e fila outbox (`services/offline-sync.ts`) para calibrações e checagens intermediárias sem internet.
- [x] **Indicador de Status de Rede e Pendências de Sincronização:**
  - Banner dinâmico universal (`components/offline-banner.tsx`) indicando modo offline e disparando envio automático ao reconectar.

---

## 🟣 Prioridade 5: Chão de Fábrica, IHM & Diagnóstico Preditivo (ISO 20816)
- [x] **Evolução do Terminal IHM LCD 3.5" (`machine-hmi-panel.tsx`):**
  - Suporte a Landscape fullscreen para suporte de máquinas industriais e alarme háptico de vibração em Zona D (Perigo - ISO 20816-3).
- [x] **Abertura Rápida de Ordem de Serviço pelo Celular:**
  - A partir da tela da máquina ou do nó IoT, botão direto para criar Ordem de Serviço preditiva / corretiva com foto tirada na hora pela câmera.

---

## 🟢 Prioridade 6: Testes, Qualidade & CI/CD Mobile
- [x] **Testes Unitários de Parsers BLE (Jest):**
  - Suite de testes Jest (`tests/ble-drivers.test.ts`) cobrindo Nordic UART, Mitutoyo U-WAVE e Sylvac (100% aprovados).
- [ ] **Testes de Integração de UI (React Native Testing Library):**
  - Testes dos fluxos de Login e Seleção de Instrumentos.
- [x] **Workflow de CI no GitHub Actions (`.github/workflows/app-ci.yml`):**
  - Pipeline automático com `tsc --noEmit`, `npm run lint` e `npm test`.
- [x] **Configuração do EAS Build (Expo Application Services):**
  - Configuração de perfis `preview` (geração de APK direto) e `production` (Google Play / App Store).
