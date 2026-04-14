ALTER TABLE "Student"
ADD COLUMN "groupId" TEXT;

CREATE INDEX "Student_groupId_idx"
ON "Student"("groupId");

ALTER TABLE "Student"
ADD CONSTRAINT "Student_groupId_fkey"
FOREIGN KEY ("groupId") REFERENCES "Group"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
