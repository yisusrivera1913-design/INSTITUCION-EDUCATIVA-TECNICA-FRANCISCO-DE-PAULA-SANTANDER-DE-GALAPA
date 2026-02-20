# Documentación del Proyecto - Docente AI Pro (I.E. Santander)

Bienvenido a la guía técnica y de usuario de tu plataforma de gestión académica inteligente. Este documento describe cómo funciona el sistema y cómo mantenerlo.

## 🚀 Tecnologías Core
1. **Frontend:** React + TypeScript + TailwindCSS.
2. **AI Orchestrator:** Groq API (Modelos Llama 3.3 70B y Mixtral).
3. **Documentación:** Biblioteca `docx` para generación de archivos Word.
4. **Seguridad:** Obfuscación de datos en `localStorage` y saneamiento de entradas.

## 📁 Estructura de Archivos
- `/src/services/groqService.ts`: El "cerebro" que conecta con Groq. Reemplaza temporalmente a Gemini para mayor velocidad.
- `/src/services/authService.ts`: Gestiona el acceso de docentes y el cifrado de sesión local.
- `/src/services/docxService.ts`: Transforma los datos de la IA en un documento formal descargable.
- `/src/components/`: Componentes visuales (Login, Formulario, Previsualización).

## 🛡️ Sistema de Auto-Debugging (Punto #3)
El sistema incluye mecanismos de autoreparación:
- **Healing de JSON:** Si la IA devuelve un texto con errores de formato, el servicio intenta extraer el objeto JSON válido automáticamente.
- **Retry Exponencial:** Si hay saturación en los servidores de Google (Error 429), la app espera 30 segundos y vuelve a intentarlo sin que el usuario tenga que hacer nada.
- **Model Fallback:** Si un modelo falla, el sistema salta automáticamente al siguiente nivel (ej: de Flash a Pro).

## 🔑 Gestión de Usuarios
Los usuarios autorizados están definidos en `services/authService.ts`. Por seguridad:
1. Las contraseñas se validan contra una lógica interna.
2. Los datos guardados en el navegador están cifrados mediante un algoritmo XOR con salt.

## 📝 Guía para Docentes
1. **DBA:** Puedes escribir tu propio DBA o dejar que la IA elija el oficial del MEN basado en el área y tema.
2. **Eje CRESE:** El sistema integra automáticamente la educación socioemocional y ciudadana.
3. **Refinamiento:** Una vez generada la secuencia, puedes usar el chat de refinamiento para pedir cambios específicos (ej: "hazlo más dinámico para niños de 6 años").

## 🌟 Formato Platinum v5.1 (Actualización Reciente)
El sistema ha sido actualizado al estándar institucional **Platinum v5.1**, que incluye:
1. **Unified Table Design:** Todas las secciones pedagógicas (1-6) están integradas en una tabla institucional única que respeta el formato oficial de la I.E. Santander.
2. **Sistema de Anexos Inteligentes:**
   - **Anexo 1:** Desglose micro-pedagógico de sesiones con momentos ADI.
   - **Anexo 2:** Rúbrica de evaluación automatizada basada en el SIEE.
   - **Anexo 3:** Talleres de aplicación listos para imprimir con retos creativos.
   - **Anexo 4:** Evaluación por competencias (10 preguntas tipo ICFES).
   - **Anexo 5:** Alertas de rectoría y recursos digitales curados.

## 📊 Mediciones de Rendimiento (Groq API Master)
El sistema está optimizado con **Groq**, garantizando latencias ultra-bajas (< 3s) facilitadas por la infraestructura de hardware LPU.

| Modelo | Categoría | Estado |
| :--- | :--- | :--- |
| **Llama 3.3 70B** | Inteligencia Base | ✅ Activo |
| **Mixtral 8x7B** | Alta Frecuencia | ✅ Respaldo (Healing activo) |

---
*Institución Educativa Técnica Francisco de Paula Santander - Galapa &copy; 2026 - Gestión Educativa Pro Platinum.*
