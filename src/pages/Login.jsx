
import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { User, Store } from 'lucide-react';

export default function Login() {
    const [userType, setUserType] = useState('student'); // 'student' or 'vendor'
    const [id, setId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            if (userType === 'student') {
                const { data, error } = await supabase.rpc('login_student', { p_studentid: id, p_password: password });
                if (error) throw error;
                if (data && data.length > 0) {
                    localStorage.setItem('user', JSON.stringify({ type: 'student', ...data[0] }));
                    navigate('/student');
                } else {
                    setError('Invalid credentials');
                }
            } else {
                const { data, error } = await supabase.rpc('login_vendor', { p_vendorid: id, p_password: password });
                if (error) throw error;
                if (data && data.length > 0) {
                    localStorage.setItem('user', JSON.stringify({ type: 'vendor', ...data[0] }));
                    navigate('/vendor');
                } else {
                    setError('Invalid credentials');
                }
            }
        } catch (err) {
            console.error(err);
            setError('Login failed: ' + err.message);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                <h1 className="text-2xl font-bold text-center mb-6 text-blue-600">Canteen Login</h1>

                <div className="flex justify-center mb-6 bg-gray-200 p-1 rounded-lg">
                    <button
                        onClick={() => setUserType('student')}
                        className={`flex items-center px-4 py-2 rounded-md transition-colors ${userType === 'student' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        <User className="w-4 h-4 mr-2" /> Student
                    </button>
                    <button
                        onClick={() => setUserType('vendor')}
                        className={`flex items-center px-4 py-2 rounded-md transition-colors ${userType === 'vendor' ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}
                    >
                        <Store className="w-4 h-4 mr-2" /> Vendor
                    </button>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            {userType === 'student' ? 'Student ID' : 'Vendor ID'}
                        </label>
                        <input
                            type="text"
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}
