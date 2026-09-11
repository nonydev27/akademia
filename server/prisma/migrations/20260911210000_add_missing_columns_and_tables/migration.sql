-- AlterTable
ALTER TABLE "Grade" ADD COLUMN     "enteredById" TEXT,
ADD COLUMN     "midtermScore" DOUBLE PRECISION,
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "TeacherClassSubject" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeacherClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeacherClassSubject_teacherId_idx" ON "TeacherClassSubject"("teacherId");

-- CreateIndex
CREATE INDEX "TeacherClassSubject_classId_idx" ON "TeacherClassSubject"("classId");

-- CreateIndex
CREATE INDEX "TeacherClassSubject_subjectId_idx" ON "TeacherClassSubject"("subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherClassSubject_teacherId_classId_subjectId_key" ON "TeacherClassSubject"("teacherId", "classId", "subjectId");

-- CreateIndex
CREATE INDEX "Grade_studentId_idx" ON "Grade"("studentId");

-- CreateIndex
CREATE INDEX "Grade_subjectId_idx" ON "Grade"("subjectId");

-- CreateIndex
CREATE INDEX "Grade_termId_idx" ON "Grade"("termId");

-- AddForeignKey
ALTER TABLE "TeacherClassSubject" ADD CONSTRAINT "TeacherClassSubject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassSubject" ADD CONSTRAINT "TeacherClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherClassSubject" ADD CONSTRAINT "TeacherClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
