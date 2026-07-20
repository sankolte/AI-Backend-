// Webhook controller - handles Clerk webhook events
import { Webhook } from "svix";
import prisma from "../../DB/db.config.js";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

// handles incoming Clerk webhook events (user.created, user.updated, user.deleted)
export const handleClerkWebhook = async (req, res) => {
    if (!WEBHOOK_SECRET) {
        console.error("CLERK_WEBHOOK_SECRET is not set in .env");
        return res.status(500).json({ error: "Webhook secret not configured" });
    }

    // get svix headers for verification
    const svix_id = req.headers["svix-id"];
    const svix_timestamp = req.headers["svix-timestamp"];
    const svix_signature = req.headers["svix-signature"];

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: "Missing svix headers" });
    }

    // verify the webhook signature
    const wh = new Webhook(WEBHOOK_SECRET);
    let evt;

    try {
        evt = wh.verify(req.body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error("Webhook verification failed:", err.message);
        return res.status(400).json({ error: "Invalid webhook signature" });
    }

    // handle the event based on type
    const eventType = evt.type;

    try {
        if (eventType === "user.created") {
            // Clerk user signed up -> create in our DB
            const { id, email_addresses, first_name, last_name } = evt.data;
            const email = email_addresses[0]?.email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim() || "User";

            // upsert for idempotency (webhooks can fire multiple times)
            await prisma.user.upsert({
                where: { clerkId: id },
                update: { name, email },
                create: {
                    clerkId: id,
                    name,
                    email,
                },
            });

            console.log(`User created/synced: ${email}`);
        }

        if (eventType === "user.updated") {
            // Clerk user updated their profile -> sync to our DB
            const { id, email_addresses, first_name, last_name } = evt.data;
            const email = email_addresses[0]?.email_address;
            const name = `${first_name || ""} ${last_name || ""}`.trim();

            await prisma.user.update({
                where: { clerkId: id },
                data: { ...(name && { name }), ...(email && { email }) },
            });

            console.log(`User updated: ${email}`);
        }

        if (eventType === "user.deleted") {
            // Clerk user deleted -> remove from our DB
            const { id } = evt.data;

            // use deleteMany to avoid error if user doesn't exist in our DB
            await prisma.user.deleteMany({
                where: { clerkId: id },
            });

            console.log(`User deleted: ${id}`);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Webhook handler error:", error);
        res.status(500).json({ error: "Webhook processing failed" });
    }
};
