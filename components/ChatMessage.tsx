
import React, { useState } from 'react';
import type { Message } from '../types';
import { Role } from '../types';
import { SpeakerIcon } from './icons/SpeakerIcon';
import { textToSpeech } from '../services/geminiService';
import { playAudio } from '../utils/audioUtils';

interface ChatMessageProps {
  message: Message;
}

const BotIcon = () => (
    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        IA
    </div>
);

const UserIcon = () => (
    <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
        U
    </div>
);


export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const [isTtsLoading, setIsTtsLoading] = useState(false);

  const handleTts = async (text: string) => {
    setIsTtsLoading(true);
    try {
        const audio = await textToSpeech(text);
        await playAudio(audio);
    } catch (error) {
        console.error("TTS failed", error);
    } finally {
        setIsTtsLoading(false);
    }
  };

  const isUser = message.role === Role.USER;

  return (
    <div className={`flex items-start gap-3 my-4 animate-fade-in-up ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <BotIcon />}
      <div className={`max-w-md md:max-w-xl lg:max-w-2xl ${isUser ? 'order-first' : ''}`}>
        <div
          className={`px-4 py-3 rounded-2xl shadow-md ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
          }`}
        >
          <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: message.text.replace(/\n/g, '<br />') }} />
           {message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
                <h4 className="text-xs font-semibold text-gray-400 mb-1">Fuentes:</h4>
                <ul className="list-none p-0 m-0">
                {message.sources.map((source, index) => (
                    source.maps?.uri && (
                    <li key={index}>
                        <a
                        href={source.maps.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 text-xs hover:underline truncate block"
                        >
                        {source.maps.title || 'Ver en Google Maps'}
                        </a>
                    </li>
                    )
                ))}
                </ul>
            </div>
          )}
        </div>
        {!isUser && (
            <div className="mt-1.5 flex justify-start">
                <button 
                    onClick={() => handleTts(message.text)}
                    disabled={isTtsLoading}
                    className="text-gray-400 hover:text-cyan-400 disabled:opacity-50 transition-colors"
                    aria-label="Leer mensaje en voz alta"
                    >
                    {isTtsLoading ? (
                        <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <SpeakerIcon className="w-5 h-5" />
                    )}
                </button>
            </div>
        )}
      </div>
       {isUser && <UserIcon />}
    </div>
  );
};