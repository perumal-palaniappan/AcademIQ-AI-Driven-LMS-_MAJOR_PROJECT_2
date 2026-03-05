import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const userStr = searchParams.get('user');

        console.log('AuthCallback - Token received:', token ? 'Yes' : 'No');
        console.log('AuthCallback - User string:', userStr);

        if (token && userStr) {
            try {
                const user = JSON.parse(decodeURIComponent(userStr));
                console.log('AuthCallback - Parsed user data:', user);
                console.log('AuthCallback - Avatar URL:', user.avatar);

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));

                console.log('AuthCallback - Data saved to localStorage');

                // Redirect to login page with success flag
                navigate('/?login_success=true');

                // You might want to trigger a toast here via a global context or event
                // But since we are redirecting, the destination page would need to handle "Welcome back"
            } catch (error) {
                console.error('Failed to parse user data', error);
                navigate('/?error=auth_failed');
            }
        } else {
            navigate('/?error=no_token');
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-700">Completing authentication...</h2>
            </div>
        </div>
    );
};

export default AuthCallback;
