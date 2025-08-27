export function generateTicketId(): string {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
  return `SATY-${dateStr}-${sequence}`;
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit'
  });
}

export function getStatusColor(status: string): string {
  const colors = {
    'Pending': 'bg-yellow-100 text-yellow-700',
    'In Progress': 'bg-blue-100 text-blue-700',
    'Waiting for Parts': 'bg-orange-100 text-orange-700',
    'Testing': 'bg-purple-100 text-purple-700',
    'Completed': 'bg-green-100 text-green-700',
    'Delivered': 'bg-gray-100 text-gray-700',
    'Paid': 'bg-green-100 text-green-700'
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
}

export function getPriorityColor(priority: string): string {
  const colors = {
    'Low': 'bg-green-100 text-green-700',
    'Medium': 'bg-blue-100 text-blue-700',
    'High': 'bg-orange-100 text-orange-700',
    'Urgent': 'bg-red-100 text-red-700'
  };
  return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-700';
}
