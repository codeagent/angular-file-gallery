<?php
require_once ('IQuery.php');

class FileSystem
{
  protected $serverRoot = '';
  protected $uploadDir = "upload";
  protected $files = [];

  protected $where = [];
  protected $limit;
  protected $offset;
  protected $total;

  public function __construct($uploadDir = 'upload')
  {
    $this->uploadDir = $uploadDir;

    $path = __DIR__ . DIRECTORY_SEPARATOR . $this->uploadDir;
    $id = 1;
    foreach (new DirectoryIterator($path ) as $fileInfo) {
      if($fileInfo->isDot())
        continue;
      if(strpos($fileInfo->getFilename(), ".") === 0)
        continue;

      list($width, $height) = getimagesize($fileInfo->getPathname());
      $this->files[] = [
        'name' => $fileInfo->getFilename(),
        'img' => "server/{$this->uploadDir}/{$fileInfo->getFilename()}",
        'type' => $fileInfo->getExtension(),
        'id' => $id++,
        'width' => $width,
        'height' => $height,
        'updated_at' => $fileInfo->getMTime()
      ];
    }

    $this->total = count($this->files);
  }


  public function limit($limit)
  {
    $this->limit = $limit;
    return $this;
  }

  public function offset($offset)
  {
    $this->offset = $offset;
    return $this;
  }

  public function where($where)
  {
    $this->where = $where;
    return $this;
  }

  public function all()
  {
    $filter = array_filter($this->where);
    $data = array_filter($this->files, function($row) use($filter) {

      $is = true;
      foreach($filter as $attribute => $value)
        $is = $is && (strpos($row[$attribute], $value) !== false);

      return $is;
    });

    $this->total = count($data);
    usort($data, function($a, $b) { return $b['updated_at'] - $a['updated_at']; });
    return array_slice($data, $this->offset, $this->limit);
  }

  public function count()
  {
    return $this->total;
  }

  public function upload($file)
  {
    $tempPath = $file['tmp_name'];
    $pathinfo = pathinfo($file['name']);
    $name = $pathinfo['filename'];
    $ext = $pathinfo['extension'];

    $all = $this->all();
    $countAll = count($all);

    $same = array_filter($all, function($row) use($name) {
      return strpos($row['name'], $name) === 0;
    });
    $same = count($same);

    $baseName = $name . ($same + 1) . ".{$ext}";
    $uploadPath = implode(DIRECTORY_SEPARATOR, [__DIR__, $this->uploadDir, $baseName]);
    move_uploaded_file($tempPath, $uploadPath);
    list($width, $height) = getimagesize($uploadPath);

    return [
      'name' => $baseName,
      'img' => "server/{$this->uploadDir}/{$baseName}",
      'type' => $ext,
      'id' => $countAll + 1,
      'width' => $width,
      'height' => $height,
      'updated_at' => time()
    ];

  }
}
