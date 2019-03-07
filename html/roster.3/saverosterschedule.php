<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $rosterempid = $parameters['rosterEmpID'];
    $date = $parameters['date'];
    $shiftstring = $parameters['shiftstring'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('roster.cp_addemployeeshift');
    $database->addParameter('rosterempid', $rosterempid, PDO::PARAM_STR);
    $database->addParameter('date', $date, PDO::PARAM_STR);
    $database->addParameter('shiftstring', $shiftstring, PDO::PARAM_STR);
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);