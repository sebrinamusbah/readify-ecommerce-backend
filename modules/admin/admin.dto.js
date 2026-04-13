exports.dashboardDTO = (data) => ({
    users: data.usersCount,
    books: data.booksCount,
    orders: data.ordersCount,
    revenue: data.revenue,
});