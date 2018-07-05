# super-meat-gulp
Нафаршированный в мясо сборщик

## Требования для установки
**1.Graphicsmagick версии 1.3.21 (или выше).**

Обычная установка:
```
yum install graphicsmagick

#Проверяем версию
gm version
```

Если установленная версия ниже минимальной, устанавливаем gm из исходников
```
# Устанавливаем зависимости для компиляции
yum install -y gcc libpng libjpeg libpng-devel libjpeg-devel ghostscript libtiff libtiff-devel freetype freetype-devel

# Скачиваем исходники gm
wget ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/1.3/GraphicsMagick-1.3.30.tar.gz
tar zxvf GraphicsMagick-1.3.30.tar.gz

# Компилим и устанавливаем
cd GraphicsMagick-1.3.9
./configure --enable-shared
make
make install

# Проверяем версию
gm version
```
