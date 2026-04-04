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
# Documentación del Proyecto - EduPlaneación AI SaaS Platform

## Visión General
EduPlaneación AI es una plataforma SaaS (Software as a Service) multinivel diseñada para la gestión académica y la planeación docente impulsada por Inteligencia Artificial. Permite que múltiples instituciones educativas utilicen el sistema de forma independiente, con su propio branding, modelos pedagógicos y formatos institucionales.

## Arquitectura Multi-Tenant
La plataforma utiliza un modelo de **Base de Datos Compartida con Aislamiento Lógico**:
1. **Identidad Institucional:** Cada colegio tiene un perfil en la tabla `instituciones` que define su logo, colores, dominio de correo y código de formato (ej: F-PA-03).
2. **Contexto IA:** Los motores de IA (Gemini/Groq) reciben el contexto del colegio del usuario en cada petición, asegurando que las secuencias generadas respeten el modelo pedagógico específico de la institución.
3. **Seguridad (RLS):** Se utilizan Row Level Security policies en Supabase para garantizar que los administrativos y docentes solo accedan a los datos vinculados a su `institucion_id`.

## Roles del Sistema
- **Super Admin:** Gestiona la plataforma global, registra colegios y monitorea el consumo de tokens.
- **Admin (Institución):** Rector o Coordinador que gestiona los docentes y estadísticas de su propio colegio.
- **Docente:** Genera, edita y exporta secuencias didácticas basadas en el currículo institucional.

## Tecnologías Principales
- **Frontend:** React + Tailwind CSS + Lucide Icons.
- **Backend/DB:** Supabase (Auth, Postgres, RLS).
- **IA:** Google Gemini 1.5 Pro & Groq (Llama 3.1).
- **Exportación:** Docx.js para generación de documentos Word Platinum.

---
*© 2026 EduPlaneación AI — Soberanía Pedagógica Escalable — Ingeniería de Prompts Avanzada.*
