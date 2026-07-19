import { supabaseAdmin } from "../config/supabase.js";
export const getSignedUploadUrl = async (req, res) => {
    const { question_id, key, ext } = req.body;

    if (!question_id || !key)
        return res.status(400).json({
            success: false,
            message: "question_id and key are required"
        });

    const safeExt = ext ? `.${ext.replace(/[^a-zA-Z0-9]/g, "")}` : ""; // strip anything weird
    const path = `${question_id}/${key}-${Date.now()}${safeExt}`;

    const { data, error } = await supabaseAdmin.storage
        .from("Image")
        .createSignedUploadUrl(path);

    if (error)
        return res.status(500).json({ success: false, message: error.message });

    res.status(200).json({
        success: true,
        data: { path: data.path, token: data.token }
    });
};