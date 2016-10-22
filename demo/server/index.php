<?php
include_once('Controller.php');
sleep(1);
$controller = new Controller();

if($_SERVER['REQUEST_METHOD'] == 'POST')
  echo $controller->actionUpload() . "\n";
else
  echo $controller->actionIndex($_REQUEST)  . "\n";
