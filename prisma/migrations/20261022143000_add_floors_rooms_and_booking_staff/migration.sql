-- CreateTable
CREATE TABLE "Floor" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Floor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- Existing tables keep their floor number and room name, and gain a real floor and room.
INSERT INTO "Floor" ("id", "restaurantId", "name", "sortOrder", "isActive", "createdAt", "updatedAt")
SELECT
    substr(md5("restaurantId" || ':floor:' || "floorNumber"::text), 1, 25),
    "restaurantId",
    CASE
        WHEN "floorNumber" = 1 THEN 'Ground'
        ELSE 'Floor ' || "floorNumber"::text
    END,
    "floorNumber",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "RestaurantTable"
GROUP BY "restaurantId", "floorNumber";

INSERT INTO "Room" ("id", "floorId", "name", "isActive", "createdAt", "updatedAt")
SELECT
    substr(md5(t."restaurantId" || ':room:' || t."floorNumber"::text || ':' || COALESCE(NULLIF(btrim(t."roomName"), ''), 'Main')), 1, 25),
    substr(md5(t."restaurantId" || ':floor:' || t."floorNumber"::text), 1, 25),
    COALESCE(NULLIF(btrim(t."roomName"), ''), 'Main'),
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "RestaurantTable" t
GROUP BY
    t."restaurantId",
    t."floorNumber",
    COALESCE(NULLIF(btrim(t."roomName"), ''), 'Main');

-- AlterTable
ALTER TABLE "RestaurantTable" ADD COLUMN "floorId" TEXT;
ALTER TABLE "RestaurantTable" ADD COLUMN "roomId" TEXT;

UPDATE "RestaurantTable" t
SET
    "floorId" = substr(md5(t."restaurantId" || ':floor:' || t."floorNumber"::text), 1, 25),
    "roomId" = substr(md5(t."restaurantId" || ':room:' || t."floorNumber"::text || ':' || COALESCE(NULLIF(btrim(t."roomName"), ''), 'Main')), 1, 25),
    "roomName" = COALESCE(NULLIF(btrim(t."roomName"), ''), 'Main');

ALTER TABLE "RestaurantTable" ALTER COLUMN "floorId" SET NOT NULL;
ALTER TABLE "RestaurantTable" ALTER COLUMN "roomId" SET NOT NULL;

-- Table numbers are unique inside a room, so two floors can both use Table 1.
DROP INDEX "RestaurantTable_restaurantId_tableNumber_key";

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN "createdByUserId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Floor_restaurantId_name_key" ON "Floor"("restaurantId", "name");

-- CreateIndex
CREATE INDEX "Floor_restaurantId_isActive_idx" ON "Floor"("restaurantId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Room_floorId_name_key" ON "Room"("floorId", "name");

-- CreateIndex
CREATE INDEX "Room_floorId_isActive_idx" ON "Room"("floorId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "RestaurantTable_roomId_tableNumber_key" ON "RestaurantTable"("roomId", "tableNumber");

-- CreateIndex
CREATE INDEX "RestaurantTable_floorId_idx" ON "RestaurantTable"("floorId");

-- CreateIndex
CREATE INDEX "RestaurantTable_roomId_idx" ON "RestaurantTable"("roomId");

-- CreateIndex
CREATE INDEX "Reservation_createdByUserId_idx" ON "Reservation"("createdByUserId");

-- AddForeignKey
ALTER TABLE "Floor" ADD CONSTRAINT "Floor_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
