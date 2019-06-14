<?php
    require('stdheaders.php');
    require('acceptparameters.php');
    require('db.php');

    $id = $parameters['id'];
    //$lastedited = date('Y-m-d h:i A');
    $database = new database($serverName, $dbname, $userid, $password);
    $database->execProcedure('tareports.roster.cp_rosterapproved');
    $database->addParameter('id', $id, PDO::PARAM_STR);
    //$database->addParameter('lastedited', $lastedited, PDO::PARAM_STR);
    $results = $database->execute_noresult(); //returns and array each element being a returned dataset
    $database->release();