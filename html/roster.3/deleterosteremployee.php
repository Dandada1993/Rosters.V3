<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $id = $parameters['id'];
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_deleterosteremployee');
    $database->addParameter('id', $id, PDO::PARAM_STR);
    $results = $database->execute(); //returns and array each element being a returned dataset
    $database->release();
    echo json_encode($results[0]);