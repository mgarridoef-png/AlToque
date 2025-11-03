import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Location, TravelInfo } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const travelBotSystemInstruction = `Eres un asistente experto en viajes y mapas. Tu objetivo es estimar los tiempos de viaje y proporcionar datos de ruta desde la ubicación actual de un usuario hasta un destino que proporcionen.
- Analiza la solicitud del usuario para identificar el destino.
- Utiliza las herramientas y los datos de ubicación proporcionados para obtener información del viaje.
- Proporciona un resumen conciso y fácil de leer de los tiempos de viaje en formato Markdown.
- SIEMPRE devuelve un objeto JSON válido que coincida con el esquema proporcionado, que contenga el resumen, las coordenadas del destino y las polilíneas de la ruta para caminar, conducir y transporte público.
- Las polilíneas deben ser un array de objetos de coordenadas lat/lng que representen el trazado.`;

const travelResponseSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "Un resumen en formato markdown de los tiempos de viaje a pie, en coche y en transporte público.",
        },
        destination: {
            type: Type.OBJECT,
            description: "Las coordenadas y el nombre del destino.",
            properties: {
                name: { type: Type.STRING, description: "El nombre de la ubicación de destino." },
                lat: { type: Type.NUMBER, description: "La latitud del destino." },
                lng: { type: Type.NUMBER, description: "La longitud del destino." },
            },
            required: ["name", "lat", "lng"],
        },
        routes: {
            type: Type.ARRAY,
            description: "Un array de objetos de ruta para diferentes modos de viaje.",
            items: {
                type: Type.OBJECT,
                properties: {
                    mode: { type: Type.STRING, description: "Modo de viaje: 'walking', 'driving', o 'transit'." },
                    polyline: {
                        type: Type.ARRAY,
                        description: "Un array de objetos de coordenadas que representan la ruta.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                lat: { type: Type.NUMBER },
                                lng: { type: Type.NUMBER },
                            },
                             required: ["lat", "lng"],
                        },
                    },
                },
                required: ["mode", "polyline"],
            },
        },
    },
    required: ["summary", "destination", "routes"],
};


export const getTravelInfo = async (prompt: string, location: Location): Promise<{ data: TravelInfo; sources: any[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        systemInstruction: travelBotSystemInstruction,
        tools: [{ googleMaps: {} }],
        toolConfig: {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude,
            },
          },
        },
        responseMimeType: "application/json",
        responseSchema: travelResponseSchema,
      },
    });

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const sources = groundingMetadata?.groundingChunks || [];
    
    const travelInfoJson = response.text;
    const travelData: TravelInfo = JSON.parse(travelInfoJson);

    return { data: travelData, sources };

  } catch (error) {
    console.error("Error fetching travel info:", error);
    if (error instanceof SyntaxError) {
        throw new Error("La IA devolvió un formato de datos no válido. Por favor, intenta reformular tu solicitud.");
    }
    throw new Error("No se pudo obtener una respuesta de la IA. Por favor, inténtalo de nuevo.");
  }
};


export const textToSpeech = async (text: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: `Di: ${text}` }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        }
        throw new Error("No se recibieron datos de audio de la API TTS.");

    } catch (error) {
        console.error("Error con el servicio TTS:", error);
        throw new Error("No se pudo generar audio a partir del texto.");
    }
};