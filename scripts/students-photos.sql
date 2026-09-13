-- scripts/students-photos.sql
-- Attach profile photos to the students created from the import CSV.
-- Matches on fullName, which is unique within the generated roster.
-- For the current tenant; adjust the TENANT filter if you have more than one school.

BEGIN;

UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Cyrus%20Paapa%20Adutwum' WHERE "fullName" = 'Cyrus Paapa Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Cyrus-Paapa-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Stella%20Esi%20Amoah' WHERE "fullName" = 'Stella Esi Amoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stella-Esi-Amoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Osei%20Kofi%20Gyasi' WHERE "fullName" = 'Osei Kofi Gyasi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Osei-Kofi-Gyasi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Patience%20Afia%20Agyemang' WHERE "fullName" = 'Patience Afia Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Patience-Afia-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Jeremiah%20Kojo%20Ampofo' WHERE "fullName" = 'Jeremiah Kojo Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Jeremiah-Kojo-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Afua%20Afia%20Akoto' WHERE "fullName" = 'Afua Afia Akoto' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Afua-Afia-Akoto
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Frank%20Kwame%20Ansah' WHERE "fullName" = 'Frank Kwame Ansah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Frank-Kwame-Ansah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Mabel%20Esi%20Wiredu' WHERE "fullName" = 'Mabel Esi Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Mabel-Esi-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kofi%20Kojo%20Nyarko' WHERE "fullName" = 'Kofi Kojo Nyarko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kofi-Kojo-Nyarko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Wilhemina%20Yaa%20Tetteh' WHERE "fullName" = 'Wilhemina Yaa Tetteh' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Wilhemina-Yaa-Tetteh
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Raymond%20Paapa%20Zakari' WHERE "fullName" = 'Raymond Paapa Zakari' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Raymond-Paapa-Zakari
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Felicia%20Esi%20Baffoe' WHERE "fullName" = 'Felicia Esi Baffoe' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Felicia-Esi-Baffoe
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Seth%20Kwesi%20Appau' WHERE "fullName" = 'Seth Kwesi Appau' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Seth-Kwesi-Appau
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ohemaa%20Aba%20Aggrey' WHERE "fullName" = 'Ohemaa Aba Aggrey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ohemaa-Aba-Aggrey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nana%20Paapa%20Dapaah' WHERE "fullName" = 'Nana Paapa Dapaah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nana-Paapa-Dapaah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Stella%20Yaa%20Essien' WHERE "fullName" = 'Stella Yaa Essien' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stella-Yaa-Essien
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Wisdom%20Nii%20Osei' WHERE "fullName" = 'Wisdom Nii Osei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Wisdom-Nii-Osei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Maame%20Esi%20Essien' WHERE "fullName" = 'Maame Esi Essien' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Maame-Esi-Essien
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Maxwell%20Kwesi%20Asante' WHERE "fullName" = 'Maxwell Kwesi Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Maxwell-Kwesi-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Akosua%20Esi%20Sarpong' WHERE "fullName" = 'Akosua Esi Sarpong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Akosua-Esi-Sarpong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nicholas%20Kofi%20Appiah' WHERE "fullName" = 'Nicholas Kofi Appiah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nicholas-Kofi-Appiah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Abena%20Akua%20Boateng' WHERE "fullName" = 'Abena Akua Boateng' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Abena-Akua-Boateng
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nii%20Kofi%20Eshun' WHERE "fullName" = 'Nii Kofi Eshun' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nii-Kofi-Eshun
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Serwaa%20Esi%20Agyemang' WHERE "fullName" = 'Serwaa Esi Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Serwaa-Esi-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nana%20Kwame%20Appiah' WHERE "fullName" = 'Nana Kwame Appiah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nana-Kwame-Appiah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Winifred%20Yaa%20Peprah' WHERE "fullName" = 'Winifred Yaa Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Winifred-Yaa-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kojo%20Yaw%20Darko' WHERE "fullName" = 'Kojo Yaw Darko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kojo-Yaw-Darko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Naomi%20Naa%20Arthur' WHERE "fullName" = 'Naomi Naa Arthur' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Naomi-Naa-Arthur
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Jeremiah%20Yaw%20Frimpong' WHERE "fullName" = 'Jeremiah Yaw Frimpong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Jeremiah-Yaw-Frimpong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Rhoda%20Esi%20Asante' WHERE "fullName" = 'Rhoda Esi Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Rhoda-Esi-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Jeffrey%20Kwesi%20Safo' WHERE "fullName" = 'Jeffrey Kwesi Safo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Jeffrey-Kwesi-Safo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Vida%20Akua%20Adutwum' WHERE "fullName" = 'Vida Akua Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vida-Akua-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kofi%20Paapa%20Wiredu' WHERE "fullName" = 'Kofi Paapa Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kofi-Paapa-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Patience%20Afia%20Addo' WHERE "fullName" = 'Patience Afia Addo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Patience-Afia-Addo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Cyrus%20Paapa%20Tetteh' WHERE "fullName" = 'Cyrus Paapa Tetteh' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Cyrus-Paapa-Tetteh
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Tracy%20Aba%20Bediatuo' WHERE "fullName" = 'Tracy Aba Bediatuo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Tracy-Aba-Bediatuo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Baffour%20Paapa%20Kyei' WHERE "fullName" = 'Baffour Paapa Kyei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Baffour-Paapa-Kyei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Josephine%20Aba%20Dartey' WHERE "fullName" = 'Josephine Aba Dartey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Josephine-Aba-Dartey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Vincent%20Kwame%20Nti' WHERE "fullName" = 'Vincent Kwame Nti' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vincent-Kwame-Nti
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Yvonne%20Naa%20Bempah' WHERE "fullName" = 'Yvonne Naa Bempah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yvonne-Naa-Bempah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Stephen%20Kwame%20Appiah' WHERE "fullName" = 'Stephen Kwame Appiah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stephen-Kwame-Appiah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Stella%20Aba%20Adutwum' WHERE "fullName" = 'Stella Aba Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stella-Aba-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ebenezer%20Kojo%20Ofori' WHERE "fullName" = 'Ebenezer Kojo Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ebenezer-Kojo-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Tracy%20Naa%20Dartey' WHERE "fullName" = 'Tracy Naa Dartey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Tracy-Naa-Dartey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Osei%20Kofi%20Ofori' WHERE "fullName" = 'Osei Kofi Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Osei-Kofi-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ivy%20Akua%20Adjei' WHERE "fullName" = 'Ivy Akua Adjei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ivy-Akua-Adjei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ishmael%20Kwesi%20Aidoo' WHERE "fullName" = 'Ishmael Kwesi Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ishmael-Kwesi-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Nadia%20Afia%20Agyemang' WHERE "fullName" = 'Nadia Afia Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nadia-Afia-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Maxwell%20Kwesi%20Wiredu' WHERE "fullName" = 'Maxwell Kwesi Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Maxwell-Kwesi-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Vida%20Aba%20Baffoe' WHERE "fullName" = 'Vida Aba Baffoe' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vida-Aba-Baffoe
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Elijah%20Yaw%20Bediatuo' WHERE "fullName" = 'Elijah Yaw Bediatuo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elijah-Yaw-Bediatuo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Patience%20Esi%20Danso' WHERE "fullName" = 'Patience Esi Danso' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Patience-Esi-Danso
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Michael%20Kwesi%20Agyemang' WHERE "fullName" = 'Michael Kwesi Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Michael-Kwesi-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ohemaa%20Esi%20Opoku' WHERE "fullName" = 'Ohemaa Esi Opoku' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ohemaa-Esi-Opoku
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwaku%20Nii%20Baidoo' WHERE "fullName" = 'Kwaku Nii Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwaku-Nii-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Serwaa%20Yaa%20Appau' WHERE "fullName" = 'Serwaa Yaa Appau' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Serwaa-Yaa-Appau
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Abdul%20Kofi%20Opoku' WHERE "fullName" = 'Abdul Kofi Opoku' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Abdul-Kofi-Opoku
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Matilda%20Akua%20Wiredu' WHERE "fullName" = 'Matilda Akua Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Matilda-Akua-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Isaac%20Kojo%20Larbi' WHERE "fullName" = 'Isaac Kojo Larbi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Isaac-Kojo-Larbi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ohemaa%20Adjoa%20Darko' WHERE "fullName" = 'Ohemaa Adjoa Darko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ohemaa-Adjoa-Darko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwabena%20Nii%20Essien' WHERE "fullName" = 'Kwabena Nii Essien' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwabena-Nii-Essien
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Grace%20Aba%20Boateng' WHERE "fullName" = 'Grace Aba Boateng' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Grace-Aba-Boateng
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwame%20Kofi%20Boateng' WHERE "fullName" = 'Kwame Kofi Boateng' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwame-Kofi-Boateng
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Abena%20Yaa%20Baidoo' WHERE "fullName" = 'Abena Yaa Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Abena-Yaa-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kelvin%20Nii%20Bonsu' WHERE "fullName" = 'Kelvin Nii Bonsu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kelvin-Nii-Bonsu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Yaa%20Aba%20Eshun' WHERE "fullName" = 'Yaa Aba Eshun' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yaa-Aba-Eshun
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nana%20Kojo%20Nyarko' WHERE "fullName" = 'Nana Kojo Nyarko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nana-Kojo-Nyarko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Abena%20Akua%20Ofori' WHERE "fullName" = 'Abena Akua Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Abena-Akua-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Elijah%20Kwesi%20Peprah' WHERE "fullName" = 'Elijah Kwesi Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elijah-Kwesi-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Tracy%20Adjoa%20Dapaah' WHERE "fullName" = 'Tracy Adjoa Dapaah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Tracy-Adjoa-Dapaah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Francis%20Kofi%20Baidoo' WHERE "fullName" = 'Francis Kofi Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Francis-Kofi-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Esther%20Naa%20Opoku' WHERE "fullName" = 'Esther Naa Opoku' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Esther-Naa-Opoku
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Isaac%20Yaw%20Nti' WHERE "fullName" = 'Isaac Yaw Nti' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Isaac-Yaw-Nti
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Theresa%20Esi%20Donkor' WHERE "fullName" = 'Theresa Esi Donkor' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Theresa-Esi-Donkor
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kofi%20Nii%20Yeboah' WHERE "fullName" = 'Kofi Nii Yeboah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kofi-Nii-Yeboah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ursula%20Adjoa%20Baidoo' WHERE "fullName" = 'Ursula Adjoa Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ursula-Adjoa-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Prince%20Kojo%20Gyamfi' WHERE "fullName" = 'Prince Kojo Gyamfi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Prince-Kojo-Gyamfi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Akua%20Akua%20Nkansah' WHERE "fullName" = 'Akua Akua Nkansah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Akua-Akua-Nkansah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Michael%20Kwesi%20Dartey' WHERE "fullName" = 'Michael Kwesi Dartey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Michael-Kwesi-Dartey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Keziah%20Afia%20Arthur' WHERE "fullName" = 'Keziah Afia Arthur' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Keziah-Afia-Arthur
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Abdul%20Paapa%20Aidoo' WHERE "fullName" = 'Abdul Paapa Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Abdul-Paapa-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Adwoa%20Aba%20Mensah' WHERE "fullName" = 'Adwoa Aba Mensah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Adwoa-Aba-Mensah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwaku%20Kojo%20Amoah' WHERE "fullName" = 'Kwaku Kojo Amoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwaku-Kojo-Amoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Theresa%20Esi%20Nyarko' WHERE "fullName" = 'Theresa Esi Nyarko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Theresa-Esi-Nyarko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nathaniel%20Paapa%20Baffoe' WHERE "fullName" = 'Nathaniel Paapa Baffoe' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nathaniel-Paapa-Baffoe
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Zainab%20Yaa%20Gyamfi' WHERE "fullName" = 'Zainab Yaa Gyamfi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Zainab-Yaa-Gyamfi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ato%20Paapa%20Agyemang' WHERE "fullName" = 'Ato Paapa Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ato-Paapa-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Zainab%20Esi%20Owusu' WHERE "fullName" = 'Zainab Esi Owusu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Zainab-Esi-Owusu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nathaniel%20Paapa%20Appiah' WHERE "fullName" = 'Nathaniel Paapa Appiah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nathaniel-Paapa-Appiah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Afua%20Afia%20Darko' WHERE "fullName" = 'Afua Afia Darko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Afua-Afia-Darko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Gideon%20Yaw%20Baffoe' WHERE "fullName" = 'Gideon Yaw Baffoe' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gideon-Yaw-Baffoe
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Keziah%20Afia%20Kyei' WHERE "fullName" = 'Keziah Afia Kyei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Keziah-Afia-Kyei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Elijah%20Nii%20Asante' WHERE "fullName" = 'Elijah Nii Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elijah-Nii-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Josephine%20Esi%20Bempah' WHERE "fullName" = 'Josephine Esi Bempah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Josephine-Esi-Bempah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwaku%20Kofi%20Eshun' WHERE "fullName" = 'Kwaku Kofi Eshun' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwaku-Kofi-Eshun
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Yvonne%20Esi%20Danso' WHERE "fullName" = 'Yvonne Esi Danso' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yvonne-Esi-Danso
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Raphael%20Paapa%20Peprah' WHERE "fullName" = 'Raphael Paapa Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Raphael-Paapa-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Zoe%20Yaa%20Wiredu' WHERE "fullName" = 'Zoe Yaa Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe-Yaa-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Bright%20Kwesi%20Aidoo' WHERE "fullName" = 'Bright Kwesi Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Bright-Kwesi-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ursula%20Aba%20Akoto' WHERE "fullName" = 'Ursula Aba Akoto' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ursula-Aba-Akoto
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ibrahim%20Kwesi%20Boateng' WHERE "fullName" = 'Ibrahim Kwesi Boateng' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim-Kwesi-Boateng
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Stella%20Afia%20Baidoo' WHERE "fullName" = 'Stella Afia Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stella-Afia-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Francis%20Kwame%20Danso' WHERE "fullName" = 'Francis Kwame Danso' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Francis-Kwame-Danso
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Akua%20Adjoa%20Opoku' WHERE "fullName" = 'Akua Adjoa Opoku' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Akua-Adjoa-Opoku
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Yaa%20Kwame%20Agyemang' WHERE "fullName" = 'Yaa Kwame Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yaa-Kwame-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Akua%20Afia%20Yorke' WHERE "fullName" = 'Akua Afia Yorke' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Akua-Afia-Yorke
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ato%20Nii%20Nyarko' WHERE "fullName" = 'Ato Nii Nyarko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ato-Nii-Nyarko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Elizabeth%20Naa%20Bempah' WHERE "fullName" = 'Elizabeth Naa Bempah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elizabeth-Naa-Bempah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Stephen%20Yaw%20Arthur' WHERE "fullName" = 'Stephen Yaw Arthur' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stephen-Yaw-Arthur
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Wilhemina%20Akua%20Peprah' WHERE "fullName" = 'Wilhemina Akua Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Wilhemina-Akua-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Elijah%20Yaw%20Aidoo' WHERE "fullName" = 'Elijah Yaw Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elijah-Yaw-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ursula%20Afia%20Blay' WHERE "fullName" = 'Ursula Afia Blay' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ursula-Afia-Blay
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kelvin%20Kofi%20Amoah' WHERE "fullName" = 'Kelvin Kofi Amoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kelvin-Kofi-Amoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Adwoa%20Afia%20Bediako' WHERE "fullName" = 'Adwoa Afia Bediako' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Adwoa-Afia-Bediako
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Lawrence%20Kofi%20Darko' WHERE "fullName" = 'Lawrence Kofi Darko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Lawrence-Kofi-Darko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Comfort%20Akua%20Wiredu' WHERE "fullName" = 'Comfort Akua Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Comfort-Akua-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwame%20Kojo%20Ampofo' WHERE "fullName" = 'Kwame Kojo Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwame-Kojo-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ivy%20Afia%20Nyarko' WHERE "fullName" = 'Ivy Afia Nyarko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ivy-Afia-Nyarko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nii%20Kwesi%20Aggrey' WHERE "fullName" = 'Nii Kwesi Aggrey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nii-Kwesi-Aggrey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ama%20Aba%20Blay' WHERE "fullName" = 'Ama Aba Blay' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ama-Aba-Blay
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Vincent%20Kwame%20Gyasi' WHERE "fullName" = 'Vincent Kwame Gyasi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vincent-Kwame-Gyasi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Queendalyn%20Aba%20Amissah' WHERE "fullName" = 'Queendalyn Aba Amissah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Queendalyn-Aba-Amissah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Patrick%20Kofi%20Antwi' WHERE "fullName" = 'Patrick Kofi Antwi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Patrick-Kofi-Antwi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Emelia%20Adjoa%20Arthur' WHERE "fullName" = 'Emelia Adjoa Arthur' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Emelia-Adjoa-Arthur
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Tobias%20Nii%20Ampofo' WHERE "fullName" = 'Tobias Nii Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Tobias-Nii-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Stella%20Esi%20Ansah' WHERE "fullName" = 'Stella Esi Ansah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stella-Esi-Ansah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Henry%20Kofi%20Asante' WHERE "fullName" = 'Henry Kofi Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Henry-Kofi-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Nhyira%20Afia%20Agyemang' WHERE "fullName" = 'Nhyira Afia Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nhyira-Afia-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ibrahim%20Kofi%20Owusu' WHERE "fullName" = 'Ibrahim Kofi Owusu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim-Kofi-Owusu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Adjoa%20Adjoa%20Acheampong' WHERE "fullName" = 'Adjoa Adjoa Acheampong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Adjoa-Adjoa-Acheampong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Richmond%20Nii%20Ofori' WHERE "fullName" = 'Richmond Nii Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Richmond-Nii-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Rebecca%20Afia%20Ampofo' WHERE "fullName" = 'Rebecca Afia Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Rebecca-Afia-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Silas%20Kwame%20Boakye' WHERE "fullName" = 'Silas Kwame Boakye' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Silas-Kwame-Boakye
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Yasmin%20Esi%20Frimpong' WHERE "fullName" = 'Yasmin Esi Frimpong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yasmin-Esi-Frimpong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Yaa%20Kojo%20Bempah' WHERE "fullName" = 'Yaa Kojo Bempah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yaa-Kojo-Bempah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Stella%20Aba%20Bonsu' WHERE "fullName" = 'Stella Aba Bonsu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Stella-Aba-Bonsu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Raymond%20Yaw%20Opoku' WHERE "fullName" = 'Raymond Yaw Opoku' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Raymond-Yaw-Opoku
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Queendalyn%20Afia%20Wiredu' WHERE "fullName" = 'Queendalyn Afia Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Queendalyn-Afia-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Osei%20Kwame%20Bediatuo' WHERE "fullName" = 'Osei Kwame Bediatuo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Osei-Kwame-Bediatuo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Matilda%20Esi%20Safo' WHERE "fullName" = 'Matilda Esi Safo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Matilda-Esi-Safo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Wisdom%20Nii%20Wiredu' WHERE "fullName" = 'Wisdom Nii Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Wisdom-Nii-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Felicia%20Adjoa%20Sarpong' WHERE "fullName" = 'Felicia Adjoa Sarpong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Felicia-Adjoa-Sarpong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Silas%20Kojo%20Addo' WHERE "fullName" = 'Silas Kojo Addo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Silas-Kojo-Addo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Adjoa%20Esi%20Awuah' WHERE "fullName" = 'Adjoa Esi Awuah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Adjoa-Esi-Awuah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ishmael%20Kwame%20Aidoo' WHERE "fullName" = 'Ishmael Kwame Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ishmael-Kwame-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Elizabeth%20Naa%20Bediako' WHERE "fullName" = 'Elizabeth Naa Bediako' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elizabeth-Naa-Bediako
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Tobias%20Paapa%20Nkrumah' WHERE "fullName" = 'Tobias Paapa Nkrumah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Tobias-Paapa-Nkrumah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Joyce%20Aba%20Baidoo' WHERE "fullName" = 'Joyce Aba Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Joyce-Aba-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Obed%20Nii%20Bonsu' WHERE "fullName" = 'Obed Nii Bonsu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Obed-Nii-Bonsu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Afua%20Akua%20Yorke' WHERE "fullName" = 'Afua Akua Yorke' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Afua-Akua-Yorke
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwadwo%20Kofi%20Mensah' WHERE "fullName" = 'Kwadwo Kofi Mensah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwadwo-Kofi-Mensah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Keziah%20Yaa%20Akoto' WHERE "fullName" = 'Keziah Yaa Akoto' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Keziah-Yaa-Akoto
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Godfred%20Kwame%20Asamoah' WHERE "fullName" = 'Godfred Kwame Asamoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Godfred-Kwame-Asamoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Esther%20Afia%20Twum' WHERE "fullName" = 'Esther Afia Twum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Esther-Afia-Twum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nathaniel%20Paapa%20Donkor' WHERE "fullName" = 'Nathaniel Paapa Donkor' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nathaniel-Paapa-Donkor
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ohemaa%20Naa%20Darko' WHERE "fullName" = 'Ohemaa Naa Darko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ohemaa-Naa-Darko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Osei%20Kwame%20Ampofo' WHERE "fullName" = 'Osei Kwame Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Osei-Kwame-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ivy%20Naa%20Acheampong' WHERE "fullName" = 'Ivy Naa Acheampong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ivy-Naa-Acheampong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Eric%20Kojo%20Dartey' WHERE "fullName" = 'Eric Kojo Dartey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Eric-Kojo-Dartey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Doris%20Naa%20Quarshie' WHERE "fullName" = 'Doris Naa Quarshie' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Doris-Naa-Quarshie
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ato%20Nii%20Nkrumah' WHERE "fullName" = 'Ato Nii Nkrumah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ato-Nii-Nkrumah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Cynthia%20Akua%20Eshun' WHERE "fullName" = 'Cynthia Akua Eshun' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Cynthia-Akua-Eshun
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Jeremiah%20Kwesi%20Asante' WHERE "fullName" = 'Jeremiah Kwesi Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Jeremiah-Kwesi-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Matilda%20Akua%20Boakye' WHERE "fullName" = 'Matilda Akua Boakye' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Matilda-Akua-Boakye
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nathaniel%20Kojo%20Ampofo' WHERE "fullName" = 'Nathaniel Kojo Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nathaniel-Kojo-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ishmael%20Nii%20Boateng' WHERE "fullName" = 'Ishmael Nii Boateng' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ishmael-Nii-Boateng
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Afua%20Yaa%20Baffoe' WHERE "fullName" = 'Afua Yaa Baffoe' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Afua-Yaa-Baffoe
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nathaniel%20Nii%20Adutwum' WHERE "fullName" = 'Nathaniel Nii Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nathaniel-Nii-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Naomi%20Adjoa%20Peprah' WHERE "fullName" = 'Naomi Adjoa Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Naomi-Adjoa-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Vincent%20Yaw%20Aidoo' WHERE "fullName" = 'Vincent Yaw Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vincent-Yaw-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Esi%20Yaa%20Nti' WHERE "fullName" = 'Esi Yaa Nti' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Esi-Yaa-Nti
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kingsley%20Nii%20Appiah' WHERE "fullName" = 'Kingsley Nii Appiah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kingsley-Nii-Appiah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Irene%20Esi%20Acheampong' WHERE "fullName" = 'Irene Esi Acheampong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Irene-Esi-Acheampong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ibrahim%20Yaw%20Larbi' WHERE "fullName" = 'Ibrahim Yaw Larbi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim-Yaw-Larbi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Philomena%20Akua%20Arthur' WHERE "fullName" = 'Philomena Akua Arthur' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Philomena-Akua-Arthur
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Daniel%20Kwame%20Donkor' WHERE "fullName" = 'Daniel Kwame Donkor' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Daniel-Kwame-Donkor
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Winifred%20Esi%20Agyemang' WHERE "fullName" = 'Winifred Esi Agyemang' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Winifred-Esi-Agyemang
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Gabriel%20Kwesi%20Ofori' WHERE "fullName" = 'Gabriel Kwesi Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gabriel-Kwesi-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Esther%20Akua%20Wiredu' WHERE "fullName" = 'Esther Akua Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Esther-Akua-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Bright%20Paapa%20Donkor' WHERE "fullName" = 'Bright Paapa Donkor' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Bright-Paapa-Donkor
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Cynthia%20Afia%20Aggrey' WHERE "fullName" = 'Cynthia Afia Aggrey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Cynthia-Afia-Aggrey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nicholas%20Kwesi%20Appau' WHERE "fullName" = 'Nicholas Kwesi Appau' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nicholas-Kwesi-Appau
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Adwoa%20Adjoa%20Sarpong' WHERE "fullName" = 'Adwoa Adjoa Sarpong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Adwoa-Adjoa-Sarpong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ato%20Nii%20Asamoah' WHERE "fullName" = 'Ato Nii Asamoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ato-Nii-Asamoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Zoe%20Adjoa%20Adjei' WHERE "fullName" = 'Zoe Adjoa Adjei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Zoe-Adjoa-Adjei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ebenezer%20Nii%20Acheampong' WHERE "fullName" = 'Ebenezer Nii Acheampong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ebenezer-Nii-Acheampong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Winifred%20Adjoa%20Dapaah' WHERE "fullName" = 'Winifred Adjoa Dapaah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Winifred-Adjoa-Dapaah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ebenezer%20Paapa%20Arthur' WHERE "fullName" = 'Ebenezer Paapa Arthur' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ebenezer-Paapa-Arthur
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ivy%20Afia%20Ofori' WHERE "fullName" = 'Ivy Afia Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ivy-Afia-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Emmanuel%20Paapa%20Danso' WHERE "fullName" = 'Emmanuel Paapa Danso' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Emmanuel-Paapa-Danso
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Yvonne%20Akua%20Baidoo' WHERE "fullName" = 'Yvonne Akua Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yvonne-Akua-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Bernard%20Paapa%20Ampofo' WHERE "fullName" = 'Bernard Paapa Ampofo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Bernard-Paapa-Ampofo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Kendra%20Naa%20Twum' WHERE "fullName" = 'Kendra Naa Twum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kendra-Naa-Twum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ibrahim%20Nii%20Adutwum' WHERE "fullName" = 'Ibrahim Nii Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ibrahim-Nii-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Mabel%20Afia%20Twum' WHERE "fullName" = 'Mabel Afia Twum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Mabel-Afia-Twum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Eric%20Paapa%20Peprah' WHERE "fullName" = 'Eric Paapa Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Eric-Paapa-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Gloria%20Yaa%20Essien' WHERE "fullName" = 'Gloria Yaa Essien' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gloria-Yaa-Essien
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Cyrus%20Kofi%20Yeboah' WHERE "fullName" = 'Cyrus Kofi Yeboah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Cyrus-Kofi-Yeboah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Gloria%20Yaa%20Boakye' WHERE "fullName" = 'Gloria Yaa Boakye' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gloria-Yaa-Boakye
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Elijah%20Paapa%20Asante' WHERE "fullName" = 'Elijah Paapa Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Elijah-Paapa-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ursula%20Naa%20Appiah' WHERE "fullName" = 'Ursula Naa Appiah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ursula-Naa-Appiah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Collins%20Yaw%20Asante' WHERE "fullName" = 'Collins Yaw Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Collins-Yaw-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Naomi%20Esi%20Kyei' WHERE "fullName" = 'Naomi Esi Kyei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Naomi-Esi-Kyei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Godfred%20Kojo%20Amissah' WHERE "fullName" = 'Godfred Kojo Amissah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Godfred-Kojo-Amissah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Rosemond%20Afia%20Wiredu' WHERE "fullName" = 'Rosemond Afia Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Rosemond-Afia-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Gabriel%20Kwesi%20Boakye' WHERE "fullName" = 'Gabriel Kwesi Boakye' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gabriel-Kwesi-Boakye
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Richmond%20Paapa%20Aidoo' WHERE "fullName" = 'Richmond Paapa Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Richmond-Paapa-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Priscilla%20Adjoa%20Asamoah' WHERE "fullName" = 'Priscilla Adjoa Asamoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Priscilla-Adjoa-Asamoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Baffour%20Kwame%20Larbi' WHERE "fullName" = 'Baffour Kwame Larbi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Baffour-Kwame-Larbi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Esi%20Adjoa%20Wiredu' WHERE "fullName" = 'Esi Adjoa Wiredu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Esi-Adjoa-Wiredu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nicholas%20Yaw%20Danso' WHERE "fullName" = 'Nicholas Yaw Danso' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nicholas-Yaw-Danso
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Felicia%20Aba%20Mensah' WHERE "fullName" = 'Felicia Aba Mensah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Felicia-Aba-Mensah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Gideon%20Kofi%20Osei' WHERE "fullName" = 'Gideon Kofi Osei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gideon-Kofi-Osei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Keziah%20Afia%20Mensah' WHERE "fullName" = 'Keziah Afia Mensah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Keziah-Afia-Mensah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Mensah%20Yaw%20Amoah' WHERE "fullName" = 'Mensah Yaw Amoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Mensah-Yaw-Amoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Ivy%20Adjoa%20Ansah' WHERE "fullName" = 'Ivy Adjoa Ansah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ivy-Adjoa-Ansah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Ebenezer%20Kojo%20Baidoo' WHERE "fullName" = 'Ebenezer Kojo Baidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Ebenezer-Kojo-Baidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Harriet%20Afia%20Peprah' WHERE "fullName" = 'Harriet Afia Peprah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Harriet-Afia-Peprah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwabena%20Kojo%20Ofori' WHERE "fullName" = 'Kwabena Kojo Ofori' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwabena-Kojo-Ofori
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Linda%20Akua%20Yorke' WHERE "fullName" = 'Linda Akua Yorke' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Linda-Akua-Yorke
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwadwo%20Paapa%20Larbi' WHERE "fullName" = 'Kwadwo Paapa Larbi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwadwo-Paapa-Larbi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Nhyira%20Naa%20Nti' WHERE "fullName" = 'Nhyira Naa Nti' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nhyira-Naa-Nti
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Desmond%20Yaw%20Aggrey' WHERE "fullName" = 'Desmond Yaw Aggrey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Desmond-Yaw-Aggrey
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Afua%20Aba%20Asante' WHERE "fullName" = 'Afua Aba Asante' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Afua-Aba-Asante
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Bernard%20Kofi%20Frimpong' WHERE "fullName" = 'Bernard Kofi Frimpong' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Bernard-Kofi-Frimpong
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Maame%20Esi%20Nti' WHERE "fullName" = 'Maame Esi Nti' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Maame-Esi-Nti
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Nathaniel%20Nii%20Nyarko' WHERE "fullName" = 'Nathaniel Nii Nyarko' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Nathaniel-Nii-Nyarko
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Priscilla%20Aba%20Osei' WHERE "fullName" = 'Priscilla Aba Osei' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Priscilla-Aba-Osei
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Obed%20Nii%20Yorke' WHERE "fullName" = 'Obed Nii Yorke' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Obed-Nii-Yorke
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Serwaa%20Aba%20Essien' WHERE "fullName" = 'Serwaa Aba Essien' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Serwaa-Aba-Essien
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Raphael%20Kwame%20Twum' WHERE "fullName" = 'Raphael Kwame Twum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Raphael-Kwame-Twum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Vivian%20Naa%20Owusu' WHERE "fullName" = 'Vivian Naa Owusu' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vivian-Naa-Owusu
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Cyrus%20Kwame%20Bediako' WHERE "fullName" = 'Cyrus Kwame Bediako' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Cyrus-Kwame-Bediako
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Queendalyn%20Afia%20Aidoo' WHERE "fullName" = 'Queendalyn Afia Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Queendalyn-Afia-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Kwame%20Yaw%20Adutwum' WHERE "fullName" = 'Kwame Yaw Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Kwame-Yaw-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Keziah%20Akua%20Dapaah' WHERE "fullName" = 'Keziah Akua Dapaah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Keziah-Akua-Dapaah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Vincent%20Kojo%20Quarshie' WHERE "fullName" = 'Vincent Kojo Quarshie' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Vincent-Kojo-Quarshie
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Yaa%20Esi%20Blay' WHERE "fullName" = 'Yaa Esi Blay' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Yaa-Esi-Blay
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Francis%20Kojo%20Essien' WHERE "fullName" = 'Francis Kojo Essien' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Francis-Kojo-Essien
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Tracy%20Adjoa%20Amoah' WHERE "fullName" = 'Tracy Adjoa Amoah' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Tracy-Adjoa-Amoah
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Jeremiah%20Nii%20Adutwum' WHERE "fullName" = 'Jeremiah Nii Adutwum' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Jeremiah-Nii-Adutwum
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Doris%20Aba%20Appau' WHERE "fullName" = 'Doris Aba Appau' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Doris-Aba-Appau
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Theophilus%20Kwame%20Larbi' WHERE "fullName" = 'Theophilus Kwame Larbi' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Theophilus-Kwame-Larbi
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Gifty%20Aba%20Yorke' WHERE "fullName" = 'Gifty Aba Yorke' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Gifty-Aba-Yorke
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=male&u=Isaac%20Nii%20Aidoo' WHERE "fullName" = 'Isaac Nii Aidoo' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Isaac-Nii-Aidoo
UPDATE "Student" SET "profilePicUrl" = 'https://i.pravatar.cc/300?gender=female&u=Adwoa%20Afia%20Aggrey' WHERE "fullName" = 'Adwoa Afia Aggrey' AND "profilePicUrl" IS NULL;
--   fallback: https://api.dicebear.com/9.x/avataaars/svg?seed=Adwoa-Afia-Aggrey

COMMIT;
