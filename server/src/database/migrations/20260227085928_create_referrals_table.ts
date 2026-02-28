import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("referrals", (table) => {
        table.string("referral_id").primary();
        table.string("patient_id").notNullable().references("patient_id").inTable("patients").onDelete("CASCADE");
        table.enum("referral_type", ["pregnancy", "malnutrition", "tb_suspect", "chronic_disease"]).notNullable();
        table.json("form_data").notNullable();
        table.enum("status", ["submitted", "received_at_phc", "under_evaluation", "completed", "follow_up_required", "closed"]).notNullable().defaultTo("submitted");
        table.float("risk_score").nullable();
        table.enum("risk_level", ["low", "medium", "high"]).nullable();
        table.json("risk_factors").nullable();
        table.string("asha_id").notNullable();
        table.json("geolocation").nullable();
        table.json("audio_file_s3_keys").nullable();
        table.text("ai_summary").nullable();
        table.text("ai_summary_hindi").nullable();
        table.string("phc_code").nullable();
        table.json("completion_data").nullable();
        table.json("status_history").nullable();
        table.timestamp("completed_at").nullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("referrals");
}

