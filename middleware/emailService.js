const nodemailer = require("nodemailer");

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

class EmailService {
  // Send order confirmation email
  async sendOrderConfirmation(userEmail, order, orderItems) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Order Confirmation - ${order.orderNumber}`,
        html: `
          <h1>Thank you for your order!</h1>
          <p>Order Number: <strong>${order.orderNumber}</strong></p>
          <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p>Total Amount: $${order.totalAmount.toFixed(2)}</p>
          
          <h2>Order Details:</h2>
          <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse;">
            <thead>
              <tr>
                <th>Book</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${orderItems
                .map(
                  (item) => `
                <tr>
                  <td>${item.book.title}</td>
                  <td>$${item.price.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          
          <p>Shipping Address: ${order.shippingAddress}</p>
          <p>Order Status: ${order.status}</p>
          
          <p>You can track your order in your account dashboard.</p>
          <p>Thank you for shopping with us!</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order confirmation email sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send order email:", error);
      throw error;
    }
  }

  // Send order status update email
  async sendOrderStatusUpdate(userEmail, order, newStatus) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Order Update - ${order.orderNumber}`,
        html: `
          <h1>Order Status Update</h1>
          <p>Your order <strong>${
            order.orderNumber
          }</strong> status has been updated.</p>
          <p><strong>New Status:</strong> ${newStatus.toUpperCase()}</p>
          <p><strong>Previous Status:</strong> ${order.status.toUpperCase()}</p>
          <p>Date: ${new Date().toLocaleDateString()}</p>
          <p>You can track your order in your account dashboard.</p>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order status update email sent to ${userEmail}`);
    } catch (error) {
      console.error("Failed to send status update email:", error);
      throw error;
    }
  }
}

module.exports = new EmailService();
