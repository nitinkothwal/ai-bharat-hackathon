import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
    await knex.schema.createTable("patients", (table) => {
        table.string("patient_id").primary();
        table.string("aadhaar_number").nullable();
        table.string("full_name").notNullable();
        table.integer("age").notNullable();
        table.enum("gender", ["male", "female", "other"]).notNullable();
        table.string("mobile_number").nullable();
        table.string("village_code").notNullable();
        table.text("address").notNullable();
        table.string("created_by_asha_id").notNullable();
        table.timestamps(true, true);
    });
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists("patients");
}

