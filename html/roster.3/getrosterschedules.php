<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $locID = $parameters['locID'];
    $weekstarting = $parameters['weekstarting'];
    if (isset($parameters['copyto'])) {
        $copyto = $parameters['copyto'];
    }
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.getrostershifts');
    $database->addParameter('locID', $locID, PDO::PARAM_STR);
    $database->addParameter('weekstarting', $weekstarting, PDO::PARAM_STR);
    if (isset($copyto)) {
        $database->addParameter('copyto', $copyto, PDO::PARAM_STR);
    }
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);