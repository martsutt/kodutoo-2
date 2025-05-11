<?php
if(isset($_POST["save"]) && !empty($_POST["save"])){
    saveToFile($_POST["save"]);
}

function saveToFile($stringToSave){
    $object = new StdClass();
    $object->content = $stringToSave;
    $object->last_modified = time();
    $jsonString = json_encode($object);

    file_put_contents("database.txt", $jsonString);
}

?>