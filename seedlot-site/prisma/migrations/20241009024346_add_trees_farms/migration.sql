-- CreateTable
CREATE TABLE "AvailableFarms" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "managerId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "totalLots" INTEGER NOT NULL,

    CONSTRAINT "AvailableFarms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreeVarieties" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "imageSrc" TEXT NOT NULL,
    "infolink" TEXT NOT NULL,

    CONSTRAINT "TreeVarieties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreesAtFarm" (
    "farmId" INTEGER NOT NULL,
    "treeVarietyId" INTEGER NOT NULL,

    CONSTRAINT "TreesAtFarm_pkey" PRIMARY KEY ("farmId","treeVarietyId")
);

-- AddForeignKey
ALTER TABLE "AvailableFarms" ADD CONSTRAINT "AvailableFarms_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreesAtFarm" ADD CONSTRAINT "TreesAtFarm_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "AvailableFarms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreesAtFarm" ADD CONSTRAINT "TreesAtFarm_treeVarietyId_fkey" FOREIGN KEY ("treeVarietyId") REFERENCES "TreeVarieties"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
