# super-meat-gulp
Нафаршированный в мясо сборщик

## Требования для установки
**1.Graphicsmagick версии 1.3.21 (или выше).**

Обычная установка:
```
yum install graphicsmagick
#Проверяем версию
gm -version
```

Если установленная версия ниже минимальной, устанавливаем gm из исходников
```
# Install build dependencies
yum install -y gcc libpng libjpeg libpng-devel libjpeg-devel ghostscript libtiff libtiff-devel freetype freetype-devel

# Get GraphicsMagick source
wget ftp://ftp.graphicsmagick.org/pub/GraphicsMagick/1.3/GraphicsMagick-1.3.9.tar.gz
tar zxvf GraphicsMagick-1.3.9.tar.gz

# Configure and compile
cd GraphicsMagick-1.3.9
./configure --enable-shared
make
make install

# Ensure everything was installed correctly
gm version

# If you are going to use this with PHP you can also instal the pecl extension
pecl install gmagick-1.0.8b2
```
