<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $rosterempid = $parameters['rosterEmpID'];
    $date = $parameters['date'];
    $shiftstring = urldecode($parameters['shiftstring']);
    $locid1 = (isset($parameters['locid1']) ? $parameters['locid1']: null); //$parameters['locid1'];
    $locid2 = (isset($parameters['locid2']) ? $parameters['locid2']: null);
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('roster.cp_addemployeeshift');
    $database->addParameter('rosterempid', $rosterempid, PDO::PARAM_STR);
    $database->addParameter('date', $date, PDO::PARAM_STR);
    $database->addParameter('shiftstring', $shiftstring, PDO::PARAM_STR);
    if (!is_null($locid1)) {
        $database->addParameter('locid1', $locid1, PDO::PARAM_STR);
    }
    if (!is_null($locid2)) {
        $database->addParameter('locid2', $locid2, PDO::PARAM_STR);
    }
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);