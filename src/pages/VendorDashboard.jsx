
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { LogOut, Store, CheckCircle, Clock, XCircle, List, ChefHat, Plus, Activity, RefreshCw, Trash2 } from 'lucide-react';

export default function VendorDashboard() {
    const [user, setUser] = useState(null);
    const [view, setView] = useState('orders'); // 'orders' or 'menu'
    const [orders, setOrders] = useState([]);
    const [menu, setMenu] = useState([]);
    const [isOpen, setIsOpen] = useState(true);

    // New Item State
    const [newItem, setNewItem] = useState({ name: '', price: '', category: '', type: 'Veg' });
    const [isAdding, setIsAdding] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) {
            navigate('/login');
            return;
        }
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.type !== 'vendor') {
            navigate('/login');
            return;
        }
        setUser(parsedUser);
        setIsOpen(parsedUser.open);
        fetchOrders(parsedUser.vendorid);
        fetchMenu(parsedUser.vendorid);

        const interval = setInterval(() => fetchOrders(parsedUser.vendorid), 10000);
        return () => clearInterval(interval);
    }, [navigate]);

    const fetchOrders = async (vendorId) => {
        const { data } = await supabase.rpc('get_vendor_orders', { p_vendorid: vendorId });
        setOrders(data || []);
    };

    const fetchMenu = async (vendorId) => {
        const { data } = await supabase.rpc('get_menu', { p_vendorid: vendorId });
        setMenu(data || []);
    };

    const refreshData = async () => {
        setIsRefreshing(true);
        await Promise.all([
            fetchOrders(user.vendorid),
            fetchMenu(user.vendorid),
            (async () => {
                const { data } = await supabase.rpc('get_vendor_details', { p_vendorid: user.vendorid });
                if (data && data.length > 0) {
                    setIsOpen(data[0].open);
                    const updatedUser = { ...user, open: data[0].open };
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }
            })()
        ]);
        setIsRefreshing(false);
    };

    const toggleStatus = async () => {
        const newStatus = !isOpen;
        const { error } = await supabase.rpc('update_vendor_status', { p_vendorid: user.vendorid, p_status: newStatus });
        if (!error) {
            setIsOpen(newStatus);
            const updatedUser = { ...user, open: newStatus };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    };

    const updateOrderStatus = async (orderId, status) => {
        let result;
        if (status === 'cancelled') {
            result = await supabase.rpc('cancel_order', { p_orderid: orderId });
        } else {
            result = await supabase.rpc('update_order_status', { p_orderid: orderId, p_status: status });
        }

        const { error } = result;

        if (!error) {
            fetchOrders(user.vendorid);
        } else {
            alert('Failed to update order status: ' + (error?.message || 'Unknown error'));
        }
    };

    const toggleItemStatus = async (itemid, currentStatus) => {
        const newStatus = currentStatus === 'available' ? 'unavailable' : 'available';
        const { error } = await supabase.rpc('update_menu_status', {
            p_vendorid: user.vendorid,
            p_itemid: itemid,
            p_status: newStatus
        });
        if (!error) {
            fetchMenu(user.vendorid);
        } else {
            alert('Failed to update status');
        }
    };

    const handleDeleteItem = async (itemid) => {
        if (!window.confirm('Are you sure you want to remove this item from your menu?')) return;

        const { error } = await supabase.rpc('delete_vendor_item', {
            p_vendorid: user.vendorid,
            p_itemid: itemid
        });

        if (!error) {
            fetchMenu(user.vendorid);
        } else {
            alert('Failed to delete item: ' + (error?.message || 'Unknown error'));
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        if (!newItem.name || !newItem.price) return;

        // add_vendor_item(p_vendorid, p_name, p_price, p_category, p_type)
        const { error } = await supabase.rpc('add_vendor_item', {
            p_vendorid: user.vendorid,
            p_name: newItem.name,
            p_price: parseFloat(newItem.price),
            p_category: newItem.category,
            p_type: newItem.type
        });

        if (error) {
            alert('Failed to add item: ' + error.message);
        } else {
            alert('Item added successfully');
            setIsAdding(false);
            setNewItem({ name: '', price: '', category: '', type: 'Veg' });
            fetchMenu(user.vendorid);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex bg-gray-50 h-screen overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div className="overflow-hidden">
                        <h1 className="text-xl font-bold text-gray-800 truncate">{user?.name}</h1>
                        <p className="text-sm text-gray-500">Vendor Panel</p>
                    </div>
                    <button
                        onClick={refreshData}
                        disabled={isRefreshing}
                        className={`text-gray-600 hover:text-blue-600 p-2 rounded-full hover:bg-gray-100 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                        title="Reload Data"
                    >
                        <RefreshCw className="w-5 h-5" />
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <button
                        onClick={() => setView('orders')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${view === 'orders' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <Activity className="w-5 h-5 mr-3" /> Orders
                    </button>
                    <button
                        onClick={() => setView('menu')}
                        className={`w-full flex items-center px-4 py-3 rounded-lg font-medium transition-colors ${view === 'menu' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <ChefHat className="w-5 h-5 mr-3" /> Menu Management
                    </button>
                </nav>
                <div className="p-4 border-t border-gray-200">
                    <button
                        onClick={toggleStatus}
                        className={`w-full py-2 px-4 rounded-lg font-bold mb-3 transition-colors ${isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                        {isOpen ? 'Store Open' : 'Store Closed'}
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center justify-center py-2 text-gray-600 hover:text-red-500">
                        <LogOut className="w-5 h-5 mr-2" /> Logout
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {view === 'orders' ? (
                    <div>
                        <h2 className="text-2xl font-bold mb-6">Incoming Orders</h2>
                        <div className="grid gap-4">
                            {orders.length === 0 ? <p className="text-gray-500">No active orders.</p> : orders.map(order => (
                                <div key={order.orderid} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center">
                                    <div className="mb-4 md:mb-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                            <span className="text-gray-500 text-sm">{new Date(order.order_time).toLocaleTimeString()}</span>
                                        </div>
                                        <h3 className="text-lg font-bold">{order.item_name} x{order.quantity}</h3>
                                        <p className="text-gray-600">Customer: {order.student_name}</p>
                                        <p className="font-mono text-gray-500 pt-1">Total: ₹{order.total}</p>
                                    </div>

                                    <div className="flex gap-2">
                                        {order.status === 'pending' && (
                                            <button onClick={() => updateOrderStatus(order.orderid, 'preparing')} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Accept</button>
                                        )}
                                        {order.status === 'preparing' && (
                                            <button onClick={() => updateOrderStatus(order.orderid, 'ready')} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">Mark Ready</button>
                                        )}
                                        {order.status === 'ready' && (
                                            <button onClick={() => updateOrderStatus(order.orderid, 'completed')} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Complete</button>
                                        )}
                                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                                            <button onClick={() => updateOrderStatus(order.orderid, 'cancelled')} className="px-3 py-2 text-red-500 hover:bg-red-50 rounded">Cancel</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Menu Management</h2>
                            <button onClick={() => setIsAdding(!isAdding)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <Plus className="w-5 h-5 mr-2" /> Add New Item
                            </button>
                        </div>

                        {isAdding && (
                            <div className="bg-white p-6 rounded-xl shadow-md mb-8 border border-gray-200">
                                <h3 className="text-lg font-bold mb-4">Add New Menu Item</h3>
                                <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <input
                                        type="text" placeholder="Item Name"
                                        className="p-2 border rounded" required
                                        value={newItem.name} onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                    />
                                    <input
                                        type="number" placeholder="Price" step="0.5"
                                        className="p-2 border rounded" required
                                        value={newItem.price} onChange={e => setNewItem({ ...newItem, price: e.target.value })}
                                    />
                                    <input
                                        type="text" placeholder="Category (e.g., Main, Drink)"
                                        className="p-2 border rounded"
                                        value={newItem.category} onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                    />
                                    <select
                                        className="p-2 border rounded"
                                        value={newItem.type} onChange={e => setNewItem({ ...newItem, type: e.target.value })}
                                    >
                                        <option value="Veg">Veg</option>
                                        <option value="Non-Veg">Non-Veg</option>
                                    </select>
                                    <div className="md:col-span-2 flex justify-end gap-2">
                                        <button type="button" onClick={() => setIsAdding(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Save Item</button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="p-4 font-semibold text-gray-600">Item Name</th>
                                        <th className="p-4 font-semibold text-gray-600">Category</th>
                                        <th className="p-4 font-semibold text-gray-600">Price</th>
                                        <th className="p-4 font-semibold text-gray-600">Status</th>
                                        <th className="p-4 font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {menu.map(item => (
                                        <tr key={item.itemid} className="hover:bg-gray-50">
                                            <td className="p-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="p-4 text-gray-600">{item.category} ({item.type})</td>
                                            <td className="p-4 font-bold text-gray-800">₹{item.price}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'available' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="p-4 flex items-center gap-2">
                                                <button
                                                    onClick={() => toggleItemStatus(item.itemid, item.status)}
                                                    className={`text-sm px-3 py-1 rounded border ${item.status === 'available'
                                                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                        : 'border-green-200 text-green-600 hover:bg-green-50'
                                                        }`}
                                                >
                                                    {item.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteItem(item.itemid)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                                                    title="Remove from Menu"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
