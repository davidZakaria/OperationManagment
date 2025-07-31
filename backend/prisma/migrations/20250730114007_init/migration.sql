-- CreateTable
CREATE TABLE "units" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME,
    "unit_code" TEXT NOT NULL,
    "project" TEXT,
    "type" TEXT,
    "sales_status" TEXT,
    "client_name" TEXT,
    "block_no" TEXT,
    "plot" TEXT,
    "floor" TEXT,
    "unit_no" TEXT,
    "bua" REAL,
    "garden" REAL,
    "roof" REAL,
    "outdoor" REAL,
    "unit_price" REAL,
    "contract_price" REAL,
    "price_installment" REAL,
    "sales_agent" TEXT,
    "broker_name" TEXT,
    "source" TEXT,
    "address" TEXT,
    "phone_number" TEXT,
    "maintenance" REAL,
    "parking" TEXT,
    "year" INTEGER,
    "delivery_date" DATETIME,
    "grace_period" INTEGER,
    "contract_finishing" TEXT,
    "comments" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "reservations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "reservation_code" TEXT NOT NULL,
    "sr" TEXT,
    "reservation_date" DATETIME,
    "client_name" TEXT,
    "nationality" TEXT,
    "id_passport" TEXT,
    "date_of_id" DATETIME,
    "serial_num_of_id" TEXT,
    "address" TEXT,
    "email" TEXT,
    "home_number" TEXT,
    "mobile_number" TEXT,
    "unit_code" TEXT,
    "payment" REAL,
    "deposit" REAL,
    "currency" TEXT,
    "payment_method" TEXT,
    "deposit_transfer_number" TEXT,
    "date_of_deposit_transfer" DATETIME,
    "bank_name" TEXT,
    "sales" TEXT,
    "sales_manager" TEXT,
    "senior_sales_manager" TEXT,
    "cancel" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "import_history" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "filename" TEXT NOT NULL,
    "record_count" INTEGER NOT NULL,
    "imported_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "form_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_type" TEXT NOT NULL,
    "fields" TEXT NOT NULL,
    "layout" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "generated_forms" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "template_id" INTEGER NOT NULL,
    "formData" TEXT NOT NULL,
    "reservation_code" TEXT,
    "unit_code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "generated_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "generated_forms_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "form_templates" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "units_unit_code_key" ON "units"("unit_code");

-- CreateIndex
CREATE UNIQUE INDEX "reservations_reservation_code_key" ON "reservations"("reservation_code");

-- CreateIndex
CREATE UNIQUE INDEX "form_templates_name_key" ON "form_templates"("name");
