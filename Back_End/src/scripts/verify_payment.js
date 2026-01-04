import pool from "../config/db.js";
import { OrderService } from "../services/order.service.js";

async function verifyFlow() {
    console.log("🔍 Starting Payment Flow Verification...");

    try {
        // 0. Fetch real IDs - Find a shop that HAS products
        const [users] = await pool.query("SELECT user_id FROM Users LIMIT 1");
        const [products] = await pool.query(`
      SELECT p.product_id, p.shop_id 
      FROM Products p 
      JOIN Shops s ON p.shop_id = s.shop_id 
      LIMIT 1
    `);

        if (!users.length || !products.length) {
            throw new Error("Missing required data (User or Shop with Products) for verification");
        }

        const userId = users[0].user_id;
        const shopId = products[0].shop_id;
        const productId = products[0].product_id;

        // 1. Create a mock order
        console.log(`1. Creating mock order for User ${userId}, Shop ${shopId}...`);
        const orderId = await OrderService.createOrder({
            user_id: userId,
            shop_id: shopId,
            delivery_address: "Test Address",
            items: [
                { product_id: productId, quantity: 2, price: 100 } // Subtotal = 200
            ],
            payment_method: "mobile_banking"
        });
        console.log(`✅ Order created with ID: ${orderId}`);

        // 2. Fetch order to verify calculations
        const order = await OrderService.getOrderById(orderId);
        console.log("📊 Order Calculations:");
        console.log(`   - Subtotal: 200`);
        console.log(`   - Tax (15%): ${order.tax_amount}`);
        console.log(`   - Gateway Fee: ${order.gateway_fee}`);
        console.log(`   - Commission: ${order.commission_total}`);
        console.log(`   - Final Total: ${order.total}`);

        // 3. Mock Payment (Set payment_status to paid)
        console.log("3. Mocking payment completion...");
        await pool.query(
            "UPDATE Orders SET payment_status = 'paid' WHERE order_id = ?",
            [orderId]
        );
        console.log("✅ Order marked as PAID");

        // 4. Admin Approval
        console.log("4. Simulating Admin Approval...");
        const result = await OrderService.updateOrderStatus(orderId, "approved");
        console.log(`✅ Admin Approval Result: ${result}`);

        // 5. Verify Seller Wallet
        const [rows] = await pool.query(
            "SELECT * FROM SellerWallets WHERE shop_id = ?",
            [shopId]
        );
        const wallet = rows[0];
        console.log("💰 Seller Wallet After Approval:");
        console.log(`   - Balance: ${wallet.balance}`);
        console.log(`   - Total Earned: ${wallet.total_earned}`);

        // 6. Verify Revenue and Tax records
        const [revenue] = await pool.query(
            "SELECT source, amount FROM PlatformRevenue WHERE order_id = ?",
            [orderId]
        );
        console.log("📈 Platform Revenue Logged:");
        revenue.forEach(r => console.log(`   - ${r.source}: ${r.amount}`));

        const [tax] = await pool.query(
            "SELECT tax_amount FROM TaxRecords WHERE order_id = ?",
            [orderId]
        );
        console.log(`📜 Tax Record Logged: ${tax[0]?.tax_amount}`);

        console.log("\n✨ Verification Completed Successfully!");
    } catch (error) {
        console.error("❌ Verification Failed:", error.message);
    } finally {
        process.exit(0);
    }
}

// Run verification
verifyFlow();
