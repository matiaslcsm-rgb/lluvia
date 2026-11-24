import duckdb, time
t = time.time()
c = duckdb.connect()
c.execute("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs; SET s3_region='us-west-2';")
rel = '2026-11-18.0'
box = "bbox.xmin > -58.7445 AND bbox.xmax < -58.6930 AND bbox.ymin > -34.5583 AND bbox.ymax < -34.5153"
base = f"s3://overturemaps-us-west-2/release/{rel}"
jobs = {
  'tools/raw/sm-places.csv': f"SELECT names.primary AS name, basic_category AS cat, ST_AsText(geometry) AS wkt FROM read_parquet('{base}/theme=places/type=place/*', hive_partitioning=1) WHERE {box} AND confidence > 0.5",
  'tools/raw/sm-landuse.csv': f"SELECT class, subtype, names.primary AS name, ST_AsText(geometry) AS wkt FROM read_parquet('{base}/theme=base/type=land_use/*', hive_partitioning=1) WHERE {box}",
  'tools/raw/sm-water.csv': f"SELECT class, subtype, names.primary AS name, ST_AsText(geometry) AS wkt FROM read_parquet('{base}/theme=base/type=water/*', hive_partitioning=1) WHERE {box}",
  'tools/raw/sm-infra.csv': f"SELECT class, subtype, names.primary AS name, ST_AsText(geometry) AS wkt FROM read_parquet('{base}/theme=base/type=infrastructure/*', hive_partitioning=1) WHERE {box}",
  'tools/raw/sm-rail.csv': f"SELECT class, subtype, names.primary AS name, ST_AsText(geometry) AS wkt FROM read_parquet('{base}/theme=transportation/type=segment/*', hive_partitioning=1) WHERE {box} AND subtype = 'rail'",
}
for f, q in jobs.items():
    c.execute(f"COPY ({q}) TO '{f}' (HEADER, DELIMITER ',')")
    n = c.execute(f"select count(*) from read_csv('{f}')").fetchone()[0]
    print(f, n, round(time.time() - t), 's', flush=True)
