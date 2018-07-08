# super-meat-gulp
Нафаршированный в мясо сборщик

[Требования](#Требования)

[Установка](#Установка)


## Функционал
1. Сборка стилей. Возможности:<br>
— препроцессор PostCSS + SASS (SCSS)<br>
— генерация SourceMap<br>
— автопрефиксы<br>
— минификация<br>
— объединение и перемещение медиа запроссов в конец файла<br>


Сначала происходит импорт подключаемых файлов


2. Генерация спрайтов
3. Сборка скритов
4. Обработка изображения

## Список TODO


## Требования
**1. Graphicsmagick версии 1.3.21 (или выше).**
```
yum install graphicsmagick
gm version
```
*Если установленная версия ниже минимальной, смотрим раздел [установка из исходников](#Установка-из-исходников)*

**2. NodeJS (тестировалось на версиях v6.9.2 и v10.1.0)**
```
curl --silent --location https://rpm.nodesource.com/setup_10.x | sudo bash -
sudo yum -y install nodejs
```

**3. Gulp**
```
npm install --global gulp
```

**4. Git**
```
yum install git
```

## Установка
1. Подключитесь по ssh и перейдите в папку с шаблоном проекта
2. Скопируйте репозиторий используя комманду
```
git clone https://github.com/TurkovBogdan/super-meat-gulp.git .
#Точка в конце не опечатка, так вы скопируете репозиторий без создания родительской папки
```

## Установка из исходников
Устанавливаем компоненты для компиляции
```
yum install -y gcc libpng libjpeg libpng-devel libjpeg-devel ghostscript libtiff libtiff-devel freetype freetype-devel
```
**Graphicsmagick**
```
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
