# Cosmópolis: Juego de Aporofobia

Un simulador ético multijugador en tiempo real basado en las teorías sociológicas y éticas de **Adela Cortina** sobre la **Aporofobia** (el rechazo al pobre). El objetivo de este proyecto es visibilizar las desigualdades estructurales, la movilidad social y las actitudes frente a la pobreza mediante una experiencia interactiva educativa.

---

## 📖 Dinámica del Juego
En **Cosmópolis**, los jugadores asumen uno de tres roles socioeconómicos (Élite, Clase Media o Áporo) y deben sobrevivir a través de 5 ciclos narrativos que representan diferentes crisis sociales (Inflación, Llegada de Extranjeros, Algoritmos Hostiles, etc.).

Durante cada ciclo, los jugadores deben cubrir sus necesidades básicas. Quienes no poseen los recursos suficientes (los Áporos) deben solicitar ayuda. El destino de los más vulnerables, su **dignidad** y la **estabilidad de la sociedad (Índice de Gini)** dependen enteramente de las decisiones éticas tomadas por las clases acomodadas.

### 🎭 Las Decisiones Éticas
Ante una petición de ayuda, los jugadores con recursos pueden elegir:
- **A) Indiferencia (Costo 0):** Fomenta la aporofobia. Destruye drásticamente la dignidad del solicitante, empujándolo a la invisibilidad social.
- **B) Caridad Paternalista (Costo 10):** Permite sobrevivir un ciclo más, dando un ligero aumento de dignidad, pero manteniendo intacta la estructura de desigualdad.
- **C) Justicia / Cordialidad (Costo 15):** Un sacrificio mayor que no solo cubre las necesidades, sino que restituye la dignidad plena del solicitante, permitiendo su movilidad social (ascendiendo a Clase Media en el próximo ciclo).

El juego culmina en diversos finales matemáticos (Utopía Cosmopolita, Trampa Nacionalista, Colapso Social, etc.) calculados en base a las métricas colectivas de la clase.

---

## 🛠️ Arquitectura y Tecnologías
El proyecto fue construido utilizando **Node.js** y **Socket.io** para garantizar sincronización en tiempo real entre decenas de dispositivos (vista de estudiantes + vista central del docente).

### Refactorización del Backend (Clean Architecture)
El motor del juego (`gameEngine.js`) ha sido refactorizado para actuar como una **Fachada (Facade)** que delega responsabilidades a servicios modulares dentro de `/src/`:
- `CycleManager.js`: Orquesta los saltos de ciclo, la economía de la narrativa y asegura el mantenimiento de la movilidad social entre rondas.
- `ActionManager.js`: Gestiona las transacciones, huelgas sociales y el impacto matemático de las decisiones éticas.
- `MetricsCalculator.js`: Calcula en tiempo real el Índice de Gini, la tasa de aporofobia y diagnostica posibles sesgos xenófobos.
- `RoomManager.js` & Modelos (`Room.js`, `Player.js`): Manejan la concurrencia y la creación del estado.

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

## 🚧 Posibles Mejoras y Bugs Conocidos

### 💡 Posibles Mejoras
- **Modularización del Frontend:** Actualmente, la lógica de la interfaz del cliente (`public/app.js`) es un monolito de más de 600 líneas. Sería ideal refactorizar este archivo separando la lógica de UI, la lógica de Sockets y el manejo del estado (o migrar a un framework como React/Vue).
- **Persistencia de Datos (Base de Datos):** El estado del juego se guarda en memoria RAM utilizando un `Map` en Node.js. Si el servidor se apaga o reinicia por error, todas las salas activas se pierden. Implementar **MongoDB** o **Redis** permitiría guardar el estado y recuperar partidas interrumpidas.
- **Sistema de Cuentas para Docentes:** Crear un panel de autenticación para que los profesores puedan guardar un historial histórico de las métricas de sus distintas clases a lo largo de los años.

### 🐛 Bugs Conocidos
- **Desconexión por Inactividad / Refresh:** Si un jugador recarga la pestaña del navegador (Refresh) pierde su `socket.id` actual. Aunque el servidor mantiene al jugador en memoria, el cliente lo trata como un jugador completamente nuevo. *Solución recomendada: Utilizar `localStorage` o Cookies de sesión para reconectar a un cliente con su jugador original.*
