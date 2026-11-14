/**
 * Fixture: cuplikan output CSV katalog USGS FDSN (format asli, disederhanakan
 * menjadi ~25 kejadian untuk test & fallback). Kolom time, latitude, longitude,
 * depth, mag, place sesuai urutan respons USGS.
 */
export const usgsFixtureCsv = `time,latitude,longitude,depth,mag,magType,nst,gap,dmin,rms,net,id,updated,place,type,horizontalError,depthError,magError,magNst,magDmin,magSource,status,locationSource,magSource
2026-08-15T03:21:44.120Z,-2.31,128.42,36.8,4.8,mb,58,74.6,2.31,0.62,us,us6000xyz1,2026-08-15T04:02:12.040Z,"102 km NE of Ternate, Indonesia",earthquake,3.1,4.2,0.08,42,1.12,us,reviewed,us,us
2026-08-18T11:08:56.310Z,2.14,127.85,102.1,5.1,mb,64,68.2,1.44,0.71,us,us6000xyz2,2026-08-18T12:10:03.220Z,"129 km WNW of Kota Ternate, Indonesia",earthquake,2.9,5.5,0.07,51,0.98,us,reviewed,us,us
2026-08-21T19:44:10.550Z,-4.62,102.77,14.2,4.6,mb,47,81.4,1.98,0.58,us,us6000xyz3,2026-08-21T20:31:44.100Z,"145 km WSW of Bengkulu, Indonesia",earthquake,3.8,2.9,0.11,35,1.33,us,reviewed,us,us
2026-08-24T06:12:33.780Z,-6.41,105.92,41.5,5.4,mww,88,52.1,1.12,0.65,us,us6000xyz4,2026-08-24T07:44:21.660Z,"86 km SW of Bandarlampung, Indonesia",earthquake,2.4,3.6,0.06,73,0.81,us,reviewed,us,us
2026-08-27T14:37:20.010Z,0.94,127.31,58.3,4.9,mb,52,77.8,2.02,0.69,us,us6000xyz5,2026-08-27T15:22:40.340Z,"78 km NE of Ternate, Indonesia",earthquake,3.4,4.8,0.09,38,1.27,us,reviewed,us,us
2026-08-30T22:55:41.240Z,-7.85,110.62,9.8,4.5,ml,41,88.9,0.44,0.52,us,us6000xyz6,2026-08-30T23:35:11.780Z,"12 km NE of Yogyakarta, Indonesia",earthquake,4.2,3.1,0.14,28,0.66,us,reviewed,us,us
2026-09-02T09:26:15.430Z,-3.11,100.35,24.6,5.6,mww,92,48.3,1.31,0.61,us,us6000xyz7,2026-09-02T10:44:09.520Z,"112 km W of Padang, Indonesia",earthquake,2.8,3.4,0.05,81,0.74,us,reviewed,us,us
2026-09-05T17:03:52.660Z,-8.44,118.73,31.2,5.2,mb,66,63.5,1.77,0.72,us,us6000xyz8,2026-09-05T18:02:33.410Z,"95 km N of Bima, Indonesia",earthquake,3.2,4.1,0.08,47,1.19,us,reviewed,us,us
2026-09-09T02:41:08.970Z,-1.88,136.94,18.4,4.7,mb,44,84.2,2.41,0.66,us,us6000xyz9,2026-09-09T03:27:55.130Z,"158 km NW of Nabire, Indonesia",earthquake,4.6,5.2,0.12,31,1.41,us,reviewed,us,us
2026-09-12T13:17:29.540Z,5.42,95.21,32.7,5.0,mb,57,72.4,1.66,0.59,us,us6000xyza,2026-09-12T14:11:47.280Z,"103 km SW of Banda Aceh, Indonesia",earthquake,3.0,3.9,0.09,44,1.05,us,reviewed,us,us
2026-09-15T20:34:47.110Z,-5.51,151.02,55.6,4.9,mb,49,79.3,2.88,0.74,us,us6000xyzb,2026-09-15T21:20:36.420Z,"211 km SE of Rabaul, Papua New Guinea",earthquake,4.1,5.8,0.10,33,1.52,us,reviewed,us,us
2026-09-18T08:49:36.220Z,-6.98,113.14,12.9,5.3,mww,84,56.8,1.03,0.63,us,us6000xyzc,2026-09-18T09:55:22.750Z,"142 km NE of Surabaya, Indonesia",earthquake,2.6,3.3,0.07,68,0.88,us,reviewed,us,us
2026-09-21T16:22:59.880Z,-7.54,128.41,152.3,4.8,mb,38,91.6,2.96,0.81,us,us6000xyzd,2026-09-21T17:10:08.130Z,"196 km E of Dili, Timor Leste",earthquake,5.2,7.4,0.13,26,1.88,us,reviewed,us,us
2026-09-24T04:11:13.460Z,1.72,126.38,88.1,5.5,mww,86,50.2,1.55,0.68,us,us6000xyze,2026-09-24T05:23:41.990Z,"164 km SE of Manado, Indonesia",earthquake,3.1,4.6,0.06,62,1.14,us,reviewed,us,us
2026-09-27T21:58:44.730Z,-2.66,140.52,10.4,6.2,mww,124,38.4,0.62,0.57,us,us6000xyzf,2026-09-27T23:15:52.870Z,"21 km W of Jayapura, Indonesia",earthquake,2.2,2.8,0.04,98,0.61,us,reviewed,us,us
2026-09-30T12:45:27.310Z,-0.44,120.66,148.7,5.1,mb,61,69.5,1.89,0.71,us,us6000xyzg,2026-09-30T13:44:16.540Z,"188 km SW of Luwuk, Indonesia",earthquake,3.5,5.1,0.09,45,1.31,us,reviewed,us,us
2026-10-03T07:33:51.020Z,-8.91,117.44,22.1,5.4,mww,90,47.8,1.24,0.60,us,us6000xyzh,2026-10-03T08:52:33.660Z,"148 km NW of Bima, Indonesia",earthquake,2.9,3.7,0.05,76,0.79,us,reviewed,us,us
2026-10-06T18:27:12.550Z,3.28,98.14,11.6,4.6,ml,43,86.1,0.58,0.54,us,us6000xyzi,2026-10-06T19:08:44.370Z,"38 km NW of Medan, Indonesia",earthquake,4.4,3.2,0.15,29,0.71,us,reviewed,us,us
2026-10-10T01:52:40.830Z,-4.35,133.25,29.8,5.8,mww,102,44.6,1.41,0.64,us,us6000xyzj,2026-10-10T03:11:27.190Z,"211 km SE of Ambon, Indonesia",earthquake,2.7,3.9,0.06,71,0.92,us,reviewed,us,us
2026-10-13T15:06:33.970Z,-6.15,105.41,38.9,5.0,mb,58,74.1,1.67,0.67,us,us6000xyzk,2026-10-13T16:02:11.420Z,"122 km SW of Bandarlampung, Indonesia",earthquake,3.3,4.4,0.08,41,1.21,us,reviewed,us,us
2026-10-16T23:41:08.140Z,-1.02,134.55,16.3,4.9,mb,46,82.7,2.14,0.72,us,us6000xyzl,2026-10-17T00:29:53.610Z,"174 km SE of Sorong, Indonesia",earthquake,4.8,6.1,0.11,32,1.55,us,reviewed,us,us
2026-10-20T10:18:57.260Z,-7.21,106.44,54.2,5.5,mww,88,51.9,1.09,0.62,us,us6000xyzm,2026-10-20T11:31:40.880Z,"67 km NE of Bandung, Indonesia",earthquake,2.5,3.5,0.05,77,0.84,us,reviewed,us,us
2026-10-24T06:44:21.310Z,2.86,125.51,94.8,5.2,mb,63,65.3,1.72,0.70,us,us6000xyzn,2026-10-24T07:52:09.540Z,"151 km N of Ternate, Indonesia",earthquake,3.1,4.7,0.07,50,1.16,us,reviewed,us,us
2026-10-28T17:29:44.680Z,-5.88,147.32,61.4,4.7,mb,40,89.4,3.11,0.83,us,us6000xyzo,2026-10-28T18:14:27.360Z,"288 km NE of Port Moresby, Papua New Guinea",earthquake,5.5,8.2,0.14,24,2.03,us,reviewed,us,us
2026-11-01T09:57:16.520Z,-3.72,102.14,27.3,6.4,mww,118,40.8,0.94,0.58,us,us6000xyzp,2026-11-01T11:22:38.770Z,"218 km W of Pangkalpinang, Indonesia",earthquake,2.3,3.1,0.04,92,0.71,us,reviewed,us,us
2026-11-05T13:12:50.240Z,-8.12,124.66,33.5,5.1,mb,57,73.8,1.51,0.66,us,us6000xyzq,2026-11-05T14:08:41.920Z,"178 km NE of Kupang, Indonesia",earthquake,3.2,4.3,0.08,46,1.09,us,reviewed,us,us
2026-11-09T04:23:38.360Z,-6.52,129.88,118.6,4.8,mb,36,92.7,3.24,0.85,us,us6000xyzr,2026-11-09T05:15:12.680Z,"245 km NE of Dili, Timor Leste",earthquake,6.1,9.4,0.16,22,2.24,us,reviewed,us,us
2026-11-12T22:51:37.660Z,-0.93,128.60,10.2,5.1,mb,55,75.9,1.38,0.65,us,us6000xyzs,2026-11-13T00:02:44.310Z,"116 km ENE of Halmahera Selatan, Indonesia",earthquake,2.8,3.6,0.07,43,1.02,us,reviewed,us,us`;
