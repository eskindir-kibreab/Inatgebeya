import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        if (user) {
            const socketUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
            const cleanUrl = socketUrl.replace('/api', ''); // Socket.io usually runs on the root

            const newSocket = io(cleanUrl, {
                withCredentials: true,
                transports: ['websocket', 'polling']
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                const userId = user.user_id || user.userId;
                if (userId) {
                    newSocket.emit('join', userId);
                }
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};
