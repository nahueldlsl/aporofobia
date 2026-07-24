# Cosmópolis: Juego de Aporofobia

Un simulador ético multijugador en tiempo real basado en las teorías sociológicas y éticas de **Adela Cortina** sobre la **Aporofobia** (el rechazo al pobre). El objetivo de este proyecto es visibilizar las desigualdades estructurales, la movilidad social y las actitudes frente a la pobreza mediante una experiencia interactiva educativa.

---

## 📖 Dinámica del Juego
En **Cosmópolis**, los jugadores asumen uno de tres roles socioeconómicos (Élite, Clase Media o Áporo) y deben sobrevivir a través de 5 ciclos narrativos que representan diferentes crisis sociales (Inflación, Algoritmos Hostiles, Aporofobia Cotidiana, etc.).

Durante cada ciclo, los jugadores deben cubrir sus necesidades básicas. Quienes no poseen los recursos suficientes (los Áporos) deben solicitar ayuda de forma anónima, exponiendo su dignidad. El destino de los más vulnerables, su **dignidad** y la **estabilidad de la sociedad (Índice de Gini)** dependen enteramente de las decisiones éticas tomadas por las clases acomodadas.

### 🎭 Las Decisiones Éticas
Ante una petición de ayuda, los jugadores con recursos pueden elegir:
- **A) Indiferencia (Costo 0):** Fomenta la aporofobia. Destruye drásticamente la dignidad del solicitante, empujándolo a la invisibilidad social.
- **B) Caridad Paternalista (Costo 10):** Permite sobrevivir un ciclo más, dando un ligero aumento de dignidad, pero manteniendo intacta la estructura de desigualdad y perpetuando la dependencia.
- **C) Justicia / Cordialidad (Costo 15):** Un sacrificio mayor que no solo cubre las necesidades, sino que restituye la dignidad plena del solicitante, permitiendo su movilidad social (ascendiendo a Clase Media en el próximo ciclo).
- **D) Inversión Propia / Lujo (Costo 20):** Ignora al pobre y gasta los recursos en lujos o estatus personal. Un riesgo grave para la Clase Media, que si se queda sin ahorros caerá instantáneamente en la pobreza al llegar las crisis.

### 🏁 Finales Sociológicos
El motor matemático del juego evalúa el comportamiento colectivo tras los 5 ciclos y puede arrojar **8 finales distintos**:
1. **Colapso Aporofóbico**: Desigualdad extrema (Índice Gini >= 0.85). El tejido social se rompe.
2. **Trampa Nacionalista**: Igualdad interna asegurada, pero excluyendo absolutamente al extranjero.
3. **Utopía Cosmopolita**: Justicia estructural y hospitalidad plena logradas.
4. **Pobreza Cero**: Nadie necesitó pedir ayuda al final del juego y no hubo excluidos (Se logra si hay redistribución o huelgas muy tempranas).
5. **Sociedad Rota (Silencio Estructural)**: Nadie pide ayuda, pero solo porque los más vulnerables ya habían sido invisibilizados (0 Dignidad).
6. **Distopía Aporofóbica**: La sociedad normalizó la indiferencia (Más del 70% de decisiones de rechazo).
7. **Avance Cosmopolita**: Hubo gran cantidad de actos de justicia, pero insuficientes para derribar toda la desigualdad.
8. **Estancamiento Social**: Se brindó caridad mínima paternalista. La estructura de desigualdad se mantiene intacta.

---

## 🛠️ Arquitectura y Tecnologías
El proyecto fue construido utilizando **Node.js** y **Socket.io** para garantizar sincronización en tiempo real entre decenas de dispositivos (vista de estudiantes + vista central del docente).

### Backend (Clean Architecture)
El motor del juego (`gameEngine.js`) actúa como una **Fachada** que delega a:
- `CycleManager.js`: Orquesta los saltos de ciclo, la economía de la narrativa y la movilidad social.
- `ActionManager.js`: Gestiona las transacciones, huelgas sociales y el impacto ético.
- `MetricsCalculator.js`: Calcula en tiempo real el Índice de Gini, tasa de aporofobia y xenofobia.

### Frontend Modular
El código del cliente ha sido estructurado en módulos **ES6 nativos** (`type="module"`), separando responsabilidades:
- `ActionManager.js` (Frontend): Manejo de clics y decisiones.
- `StudentController.js`: Sincronización reactiva de estado (Renderización de HUD).

---

## 🔬 Simulaciones y Pruebas Matemáticas
En la carpeta `/tests` se incluye un script `simulate.js` capaz de correr el motor del juego en modalidad *headless* (sin navegador). Esto se utilizó para jugar **miles de partidas simuladas** con aulas de 20 jugadores virtuales bajo distintas estrategias sociológicas (Egoísta, Altruista, Mixta, etc.). 
*Los resultados demuestran un balance perfecto, probando que la Utopía y el Colapso responden con exactitud a los axiomas de Adela Cortina.*

---

## 🚀 Instalación y Uso

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/nahueldlsl/aporofobia.git
   cd aporofobia
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

3. Ejecutar el servidor:
   ```bash
   node server.js
   ```

4. Abrir en el navegador:
   - **Vista de Estudiantes:** `http://localhost:3000`
   - **Vista del Docente:** `http://localhost:3000/teacher`

---

## 🚧 Posibles Mejoras (Roadmap Futuro)
- **Persistencia de Datos:** Implementar **MongoDB** o **Redis** permitiría guardar el estado y recuperar partidas interrumpidas si el servidor se apaga.
- **Base de Datos para Docentes:** Permitir que los profesores guarden un registro histórico de cómo se han comportado sus distintas clases a lo largo de los años.
- **Cookies / Sesiones:** Utilizar `localStorage` o Cookies de sesión para reconectar automáticamente a un estudiante si recarga la pestaña por accidente.
