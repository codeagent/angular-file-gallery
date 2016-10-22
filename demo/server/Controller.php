<?php
include_once('Model.php');
include_once('FileSystem.php');

class Controller
{
  const UPLOAD_DIR = 'upload';
  const SOURCE = 'filesystem';

  public $pageParam = 'page';
  public $pageSizeParam = 'page-size';
  public $filterParam = 'filter';
  public $totalItemsHeader = 'X-Pagination-Total-Count';

  public $defaultPage = 1;
  public $defaultPageSize = 20;

  protected $params;

  public function actionIndex($params)
  {
    $this->params = $params;

    if(self::SOURCE == 'filesystem')
      $model = new FileSystem();
    else
      $model = new Model();

    if(isset($this->params[$this->filterParam]))
      $model->where($this->params[$this->filterParam]);

    $page = isset($this->params[$this->pageParam]) ? (int)$this->params[$this->pageParam] : $this->defaultPage;
    $page = max(0, $page);
    $size = isset($this->params[$this->pageSizeParam]) ? (int)$this->params[$this->pageSizeParam] : $this->defaultPageSize;

    $all = $model
      ->limit($size)
      ->offset(($page - 1) * $size)
      ->all();

      header("Content-Type: application/json; charset=utf-8");
      header("{$this->totalItemsHeader}: {$model->count()}");
      echo json_encode($all);
      die();
  }

  public function actionUpload()
  {
      $fs = new FileSystem();

      header("Content-Type: application/json; charset=utf-8");
      echo json_encode($fs->upload($_FILES['file']));
      die();
  }
}
