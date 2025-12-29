-- CreateTable
CREATE TABLE "public"."url_data" (
    "id" SERIAL NOT NULL,
    "url_id" TEXT NOT NULL,
    "org_url" TEXT NOT NULL,
    "shorter_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "url_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Click" (
    "id" SERIAL NOT NULL,
    "url_id" TEXT NOT NULL,
    "clicked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip_address" TEXT,
    "country" TEXT,
    "city" TEXT,
    "user_agent" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "device_type" TEXT,
    "referrer" TEXT,

    CONSTRAINT "Click_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "url_data_url_id_key" ON "public"."url_data"("url_id");

-- CreateIndex
CREATE UNIQUE INDEX "url_data_org_url_key" ON "public"."url_data"("org_url");

-- CreateIndex
CREATE UNIQUE INDEX "url_data_shorter_url_key" ON "public"."url_data"("shorter_url");

-- CreateIndex
CREATE INDEX "Click_url_id_idx" ON "public"."Click"("url_id");

-- CreateIndex
CREATE INDEX "Click_clicked_at_idx" ON "public"."Click"("clicked_at");

-- AddForeignKey
ALTER TABLE "public"."Click" ADD CONSTRAINT "Click_url_id_fkey" FOREIGN KEY ("url_id") REFERENCES "public"."url_data"("url_id") ON DELETE CASCADE ON UPDATE CASCADE;
