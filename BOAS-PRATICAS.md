# Boas Práticas - Projeto Metrologia (amemiya-app)

Este documento define os padrões de código para este projeto.

### 1. Nomenclatura de Arquivos

* **Componentes:** PascalCase (`MeuComponente.tsx`).
* **Hooks:** camelCase (`useMeuHook.ts`).
* **Contextos:** PascalCase (`MeuContexto.tsx`).
* **Telas (Rotas):** kebab-case ou `index.tsx` (padrão do Expo Router).

### 2. Gerenciamento de Estado

1.  **Estado da API (Servidor):**
    * **Ferramenta:** `React Query (@tanstack/react-query)`.
    * **Regra:** NUNCA use `useState` para dados vindos da API (instrumentos, stats, etc.).
    * **Prática:** Crie hooks customizados para cada *query* (ex: `useInstruments.ts`).

2.  **Estado Global (UI):**
    * **Ferramenta:** `Context API`.
    * **Regra:** Use apenas para estados que afetam a UI global e não vêm da API.
    * **Exemplos:** `AuthContext` (usuário logado), `ThemeContext` (dark/light mode).

3.  **Estado Local (Componente):**
    * **Ferramenta:** `useState` / `useReducer`.
    * **Regra:** Use para estados que vivem e morrem com o componente.
    * **Exemplos:** `const [isModalVisible, setIsModalVisible] = useState(false);`

### 3. Componentes

* **UI (`components/ui/`):**
    * Componentes 100% reutilizáveis e "burros".
    * Eles não sabem sobre a lógica de negócio.
    * *Ex: `Button.tsx`, `Card.tsx`, `Input.tsx`.*

* **Features (`components/features/`):**
    * Componentes específicos de uma feature, que podem conter lógica de negócio.
    * *Ex: `components/features/instruments/InstrumentCard.tsx`, `components/features/dashboard/StatCard.tsx`.*

### 4. Estilização

* **NÃO** use cores hard-coded (ex: `color: '#FFF'`).
* **SEMPRE** use o hook `useThemeColor` para estilização dinâmica (light/dark mode).
    * *Ex: `const textColor = useThemeColor({}, 'text');`*
* **SEMPRE** defina cores semânticas no `constants/theme.ts` (ex: `primary`, `danger`).

### 5. Typescript

* **NUNCA** use `any` ou `@ts-ignore`.
* Defina todas as entidades da API no `types/entities.ts`.