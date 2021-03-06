<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $locID = $parameters['locID'];
    $weekstarting = $parameters['weekstarting'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_getotheremployees');
    $database->addParameter('locID', $locID, PDO::PARAM_STR);
    $database->addParameter('weekstarting', $weekstarting, PDO::PARAM_STR);
    try {
        $results = $database->execute(); //returns and array each element being a returned dataset
        echo json_encode($results[0]);
    } catch (PDOException $e) {
        echo json_encode(null); 
    } finally {
        $database->release();
    }
    