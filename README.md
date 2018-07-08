# super-meat-gulp
Версия: 0.9-a

Нафаршированный в мясо сборщик

[Функционал](#Функционал)<br>
[Требования](#Требования)<br>
[Установка](#Установка)


## Функционал
**Настройки**
Настройки выведены в отельный файл

**Сборка стилей:**<br>
— препроцессор PostCSS + SCSS<br>
— генерация SourceMap<br>
— автопрефиксы<br>
— минификация<br>
— объединение и перемещение медиа запроссов в конец файла<br>

Стили компилируеться в три этапа: 
1. До обработки препроцессором
Если мы хотим использовать плагины PostCSS для расширения синтаксиса, они должны применяться ко всему коду т.е. включая подключаемые файлы. Поэтому мы используетм postcssImport и инклудим все вложенные файлы стилей до обработки препроцессором. 
На этом этапе вы можете поключить любые плагины, которые должны выполняться до основного препроцессора.
2. SCSS
Обработка обычным SCSS
3. PostCSSAfter
Финальная обработка



**Генерация спрайтов**<br>
— неограниченное кол-во наборов спрайтов<br>
— создание спрайтов с поддержкой ретины (авторесайз x2->x1)<br>
— оптимизация спрайтов

**Сборка скритов**
— генерация SourceMap<br>
— обработка кода через babel, можно использовать es6<br>
— минификация<br>

**Обработка изображений**<br>
Корректная оптимизация изображений. Обрабатываються и минимизируються только те изображения, которые не обрабатывались или были повторно загруженны (используеться собственный модуль, он создаёт лог изменений файла), даже если папка выборки и сохранения совпадают.

## Список TODO


## Требования
**0.Сервер**<br>
RAM >= 2GB<br>
Cборщик жрёт ~260-589MB. Если оперативки на сервере меньше 2GB, даже не пробуйте (при 512MB не сможете установить, 1GB ошибки нехватки памяти).

**1. GraphicsМagick версии 1.3.21 (или выше).**
```
yum install graphicsmagick
gm version
```
*Если установленная версия ниже минимальной или пакет не найден, смотри [установку GraphicsМagick из исходников](#Установка-graphicsМagick-из-исходников)*

**2. [NodeJS](https://nodejs.org/en/download/package-manager/) (тестировалось на версиях v6.9.2 и v10.1.0)**
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

## FAQ
### Установка GraphicsМagick из исходников
```
# Выполняем из под root или через sudo
# Устанавливаем компоненты для компиляции
yum install -y gcc libpng libjpeg libpng-devel libjpeg-devel ghostscript libtiff libtiff-devel freetype freetype-devel

# Переходим в временную директорию
cd /tmp/

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
