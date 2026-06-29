
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, ShoppingCart, Clock, Store, Plus, Minus, Trash2, RefreshCw, Check } from 'lucide-react';

export default function StudentDashboard() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('vendors'); // 'vendors', 'cart', 'history'
    const [vendors, setVendors] = useState([]);
    const [selectedVendor, setSelectedVendor] = useState(null);
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [addedItems, setAddedItems] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.type !== 'student') {
            navigate('/login');
            return;
        }
        setUser(parsedUser);
        fetchVendors();
        fetchOrders(parsedUser.studentid);

        const savedCart = localStorage.getItem('cart');
        if (savedCart) setCart(JSON.parse(savedCart));
    }, [navigate]);

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const fetchVendors = async () => {
        const { data } = await supabase.rpc('get_vendors');
        setVendors(data || []);
    };

    const fetchMenu = async (vendorId) => {
        setLoading(true);
        const { data } = await supabase.rpc('get_available_menu', { p_vendorid: vendorId });
        setMenu(data || []);
        setLoading(false);
    };

    const fetchOrders = async (studentId) => {
        const { data } = await supabase.rpc('get_student_orders', { p_studentid: studentId });
        setOrders(data || []);
    };

    const fetchStudentDetails = async (studentId) => {
        const { data, error } = await supabase.rpc('get_student_details', { p_studentid: studentId });
        if (!error && data && data.length > 0) {
            const updatedUser = { ...user, ...data[0] };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchVendors(),
            fetchOrders(user.studentid),
            fetchStudentDetails(user.studentid),
            selectedVendor ? fetchMenu(selectedVendor.vendorid) : Promise.resolve()
        ]);
        setIsRefreshing(false);
    };

    const addToCart = (item, vendorId) => {
        setCart(prev => {
            const existing = prev.find(i => i.itemid === item.itemid && i.vendorid === vendorId);
            if (existing) {
                return prev.map(i => i.itemid === item.itemid && i.vendorid === vendorId ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, { ...item, vendorid: vendorId, quantity: 1, vendorName: selectedVendor.name }];
        });

        // Visual feedback
        setAddedItems(prev => ({ ...prev, [item.itemid]: true }));
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [item.itemid]: false }));
        }, 1000);
    };

    const updateQuantity = (itemid, vendorid, delta) => {
        setCart(prev => prev.map(i => {
            if (i.itemid === itemid && i.vendorid === vendorid) {
                const newQty = Math.max(0, i.quantity + delta);
                return { ...i, quantity: newQty };
            }
            return i;
        }).filter(i => i.quantity > 0));
    };

    const removeFromCart = (itemid, vendorid) => {
        setCart(prev => prev.filter(i => !(i.itemid === itemid && i.vendorid === vendorid)));
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setLoading(true);
        try {
            for (const item of cart) {
                const { error } = await supabase.rpc('place_order', {
                    p_studentid: user.studentid,
                    p_vendorid: item.vendorid,
                    p_itemid: item.itemid,
                    p_quantity: item.quantity
                });
                if (error) throw error;
            }

            alert('Orders placed successfully!');
            setCart([]);
            localStorage.removeItem('cart');
            fetchOrders(user.studentid);
        } catch (err) {
            alert('Failed to place order: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('cart');
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white shadow px-6 py-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">Welcome, {user?.name}</h1>
                <div className="flex items-center gap-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        Balance: ₹{user?.balance || 0}
                    </span>
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className={`text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Reload Data"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                    <button onClick={handleLogout} className="text-gray-600 hover:text-red-500" title="Logout">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden">
                <nav className="w-64 bg-white border-r border-gray-200 p-4 space-y-2">
                    <button onClick={() => setView('vendors')} className={`w-full flex items-center p-3 rounded-lg ${view === 'vendors' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Store className="w-5 h-5 mr-3" /> Browse Vendors
                    </button>
                    <button onClick={() => setView('cart')} className={`w-full flex items-center p-3 rounded-lg ${view === 'cart' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <ShoppingCart className="w-5 h-5 mr-3" /> Cart ({cart.reduce((a, c) => a + c.quantity, 0)})
                    </button>
                    <button onClick={() => setView('history')} className={`w-full flex items-center p-3 rounded-lg ${view === 'history' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <Clock className="w-5 h-5 mr-3" /> Order History
                    </button>
                </nav>

                <main className="flex-1 overflow-auto p-6">
                    {view === 'vendors' && !selectedVendor && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vendors.length === 0 ? <p>No vendors open currently.</p> : vendors.map(v => (
                                <div key={v.vendorid} onClick={() => { setSelectedVendor(v); fetchMenu(v.vendorid); }} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-blue-200 transition-all">
                                    <h3 className="text-lg font-semibold text-gray-800">{v.name}</h3>
                                    <p className="text-green-600 text-sm mt-1">Open Now</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {view === 'vendors' && selectedVendor && (
                        <div>
                            <button onClick={() => setSelectedVendor(null)} className="mb-4 text-blue-600 hover:underline">&larr; Back to Vendors</button>
                            <h2 className="text-2xl font-bold mb-4">{selectedVendor.name} Menu</h2>
                            {loading ? <p>Loading menu...</p> : (
                                <div className="space-y-4">
                                    {menu.map(item => (
                                        <div key={item.itemid} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold">{item.name}</h4>
                                                <p className="text-sm text-gray-500">{item.type} • {item.category}</p>
                                                <p className="text-blue-600 font-bold mt-1">₹{item.price}</p>
                                            </div>
                                            <button
                                                onClick={() => addToCart(item, selectedVendor.vendorid)}
                                                className={`p-2 rounded-full transition-colors ${addedItems[item.itemid] ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                                            >
                                                {addedItems[item.itemid] ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'cart' && (
                        <div className="max-w-2xl mx-auto">
                            <h2 className="text-2xl font-bold mb-6">Your Cart</h2>
                            {cart.length === 0 ? <p className="text-gray-500">Your cart is empty.</p> : (
                                <div className="space-y-4">
                                    {cart.map((item, idx) => (
                                        <div key={`${item.vendorid}-${item.itemid}`} className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                                            <div>
                                                <h4 className="font-semibold">{item.name}</h4>
                                                <p className="text-sm text-gray-500">from {item.vendorName || 'Vendor'}</p>
                                                <p className="text-blue-600 font-bold">₹{item.price} x {item.quantity}</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button onClick={() => updateQuantity(item.itemid, item.vendorid, -1)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="font-medium">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.itemid, item.vendorid, 1)} className="p-1 text-gray-600 hover:bg-gray-100 rounded">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => removeFromCart(item.itemid, item.vendorid)} className="ml-2 text-red-500 hover:bg-red-50 p-2 rounded">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="mt-8 border-t pt-6 flex justify-between items-center">
                                        <span className="text-xl font-bold">Total: ₹{cart.reduce((sum, i) => sum + (i.price * i.quantity), 0).toFixed(2)}</span>
                                        <button onClick={handleCheckout} disabled={loading} className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
                                            {loading ? 'Processing...' : 'Place Order'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {view === 'history' && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-bold mb-6">Order History</h2>
                            {orders.map(order => (
                                <div key={order.orderid} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-gray-800">{order.item_name} <span className="text-gray-500 text-sm font-normal">x{order.quantity}</span></h4>
                                            <p className="text-sm text-gray-600">Vendor: {order.vendor_name}</p>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(order.order_time).toLocaleString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold uppercase mb-1 ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                            <p className="font-bold text-gray-900">₹{order.total}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
