
Glosario
--------

Node.js: Node.js es un entorno de ejecución de JavaScript basado en el motor de JavaScript V8 de Chrome. Permite ejecutar código JavaScript fuera del navegador, lo que significa que puedes utilizar JavaScript para crear aplicaciones de servidor, herramientas de línea de comandos y más. Node.js proporciona un conjunto de módulos y bibliotecas que facilitan el desarrollo de aplicaciones escalables y de alto rendimiento.

npm: npm (Node Package Manager) es el administrador de paquetes predeterminado para Node.js. Es una herramienta que te permite descargar, instalar y administrar las dependencias de tu proyecto de manera sencilla. Con npm, puedes acceder a un vasto ecosistema de paquetes de código abierto que te ayudarán a agregar funcionalidades a tus aplicaciones de Node.js. Además, npm también te permite publicar tus propios paquetes y compartirlos con la comunidad.

npx: npx es una herramienta que viene incluida con npm a partir de la versión 5.2.0. Su objetivo principal es ejecutar paquetes de Node.js sin necesidad de instalarlos globalmente en tu sistema. Con npx, puedes ejecutar comandos de paquetes específicos sin tener que preocuparte por la instalación previa. Esto es especialmente útil cuando necesitas ejecutar una herramienta o script de línea de comandos de forma puntual sin tener que instalarla de forma permanente en tu sistema. npx también te permite ejecutar diferentes versiones de un mismo paquete, lo que facilita la gestión de dependencias en tu proyecto.

Pasos requeridos para poder utilizar los templates
--------------------------------------------------

1) Instalar Node.js desde https://nodejs.org/, descargar la versión LTS (Long Term Support).

2) para ejecutar cualquier de los proyectos en las carpetas template*
es necesario ejecutar "npm i" dentro de cada una de las carpetas para que se descarguen los paquetes definidos como dependencias en package.json

3) Ejecutar run_dev_server.bat para levantar el servidor de desarrollo o ejecutar run_build.bat para compilar una version de producción en la carpeta ./dist