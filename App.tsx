import React, { useState, useEffect, useRef } from 'react';
import { useGeolocation } from './hooks/useGeolocation';
import { getTravelInfo } from './services/geminiService';
import type { Message, MapData } from './types';
import { Role } from './types';
import { ChatInput } from './components/ChatInput';
import { ChatMessage } from './components/ChatMessage';
import { Map } from './components/Map';

const App: React.FC = () => {
  const { location, isLoading: isLocationLoading, error: locationError } = useGeolocation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [mapData, setMapData] = useState<MapData>({ destination: null, routes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location && messages.length === 0) {
      setMessages([
        {
          role: Role.MODEL,
          text: "¡Hola! Soy tu asistente de viajes. Ya tengo tu ubicación. ¿A dónde te gustaría ir? Puedo estimar los tiempos de viaje a pie, en coche o en transporte público.",
          id: 'welcome-message'
        }
      ]);
    }
  }, [location, messages.length]);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (userInput: string) => {
    if (!location) {
      setError("No se puede enviar el mensaje: la ubicación no está disponible.");
      return;
    }

    const newUserMessage: Message = {
      role: Role.USER,
      text: userInput,
      id: Date.now().toString(),
    };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    setError(null);
    setMapData({ destination: null, routes: [] });

    try {
      const { data, sources } = await getTravelInfo(userInput, location);
      const newBotMessage: Message = {
        role: Role.MODEL,
        text: data.summary,
        sources: sources,
        id: (Date.now() + 1).toString(),
      };
      setMessages(prev => [...prev, newBotMessage]);
      setMapData({
          destination: data.destination,
          routes: data.routes
      });
    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStatus = () => {
    if (isLocationLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-lg font-medium">Obteniendo tu ubicación...</p>
            <p className="text-sm">Por favor, permite el acceso a la ubicación para continuar.</p>
        </div>
      )
    }
    if (locationError) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-400 p-8">
            <h2 className="text-xl font-bold mb-2">Error de Ubicación</h2>
            <p>{locationError}</p>
            <p className="mt-2 text-sm text-gray-400">Por favor, activa los servicios de ubicación en tu navegador y actualiza la página.</p>
        </div>
      );
    }
    return null;
  }
  
  const statusContent = renderStatus();

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
      <section className="w-full h-[40vh] md:h-full md:w-1/2 lg:w-3/5">
          {location ? (
              <Map userLocation={location} mapData={mapData} />
          ) : (
              <div className="h-full w-full bg-gray-800 flex items-center justify-center text-gray-400 p-4 text-center">
                  <p>Esperando la ubicación para mostrar el mapa...</p>
              </div>
          )}
      </section>

      <section className="flex flex-col w-full h-[60vh] md:h-full md:w-1/2 lg:w-2/5 bg-gray-900">
        <header className="bg-gray-800/50 backdrop-blur-sm p-4 text-center shadow-lg border-b border-t md:border-t-0 border-l-0 md:border-l border-gray-700">
          <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">Asistente de Viaje IA</h1>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4">
          <div className="max-w-4xl mx-auto">
            {statusContent ? statusContent : (
              <>
                {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
                {isLoading && (
                    <div className="flex items-start gap-3 my-4 animate-fade-in-up">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">IA</div>
                        <div className="px-4 py-3 rounded-2xl shadow-md bg-gray-700">
                            <div className="flex items-center gap-2 text-gray-400">
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"></div>
                            </div>
                        </div>
                    </div>
                )}
                 {error && <p className="text-red-400 text-center my-4">{error}</p>}
                <div ref={chatEndRef} />
              </>
            )}
          </div>
        </main>

        <footer className="border-t border-gray-700">
            <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || isLocationLoading || !!locationError} />
        </footer>
      </section>
    </div>
  );
};

export default App;