let geriSayimInterval;
const API_KEY = "0kCzHMw8PCVAEwVkyFqGvR:6Hw0gYoQ1AmNDbhxvxa1m9"; 

const TURKIYE_ILLERI = [
    "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin", 
    "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", 
    "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", 
    "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", 
    "Hatay", "Isparta", "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", 
    "Kırklareli", "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", 
    "Kahramanmaraş", "Mardin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", 
    "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Tekirdağ", "Tokat", "Trabzon", 
    "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat", "Zonguldak", "Aksaray", "Bayburt", 
    "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın", "Ardahan", "Iğdır", "Yalova", 
    "Karabük", "Kilis", "Osmaniye", "Düzce"
];

// --- TEMA VE DROPDOWN FONKSİYONLARI ---
window.temaDegistir = function(temaIsmi) {
    document.body.setAttribute('data-theme', temaIsmi);
    localStorage.setItem('seciliTema', temaIsmi);
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if(temaIsmi === 'light') metaThemeColor.setAttribute("content", "#fdfbf7");
    else if(temaIsmi === 'dark') metaThemeColor.setAttribute("content", "#0f172a");
    else metaThemeColor.setAttribute("content", "#360416");
}

window.dropdownToggle = function() {
    document.querySelector('.custom-dropdown').classList.toggle('show');
}

window.onclick = function(event) {
    if (!event.target.matches('#sehir-baslik')) {
        const dropdowns = document.getElementsByClassName("custom-dropdown");
        for (let i = 0; i < dropdowns.length; i++) {
            const openDropdown = dropdowns[i];
            if (openDropdown.classList.contains('show')) {
                openDropdown.classList.remove('show');
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const kayitliTema = localStorage.getItem('seciliTema') || 'default';
    temaDegistir(kayitliTema);

    function selamlamaGuncelle() {
        const saat = new Date().getHours();
        const mesajAlani = document.getElementById('selamlama-mesaji');
        let mesaj = "Hoş Geldiniz";
        if (saat >= 5 && saat < 12) mesaj = "Hayırlı Sabahlar";
        else if (saat >= 12 && saat < 17) mesaj = "Hayırlı Günler";
        else if (saat >= 17 && saat < 22) mesaj = "Hayırlı Akşamlar";
        else mesaj = "Hayırlı Geceler";
        mesajAlani.textContent = mesaj;
    }
    selamlamaGuncelle();
    setInterval(selamlamaGuncelle, 60000);

    const sehirListesiUl = document.getElementById('sehir-listesi');
    const sehirBaslik = document.getElementById('sehir-baslik');
    const sonrakiVakitIsim = document.getElementById('sonraki-vakit-isim');
    const kalanZaman = document.getElementById('kalan-zaman');
    const vakitP_elementleri = document.querySelectorAll('.kart p[data-vakit]');

    const circle = document.querySelector('.progress-ring__circle');
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = circumference;

    function setProgress(percent) {
        // Yüzdeye göre ofseti hesapla
        const offset = circumference - (percent / 100) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    const vakitEslesme = { 'imsak': 'İmsak', 'gunes': 'Güneş', 'ogle': 'Öğle', 'ikindi': 'İkindi', 'aksam': 'Akşam', 'yatsi': 'Yatsı' };
    const idEslesme = { 'İmsak': 'kutu-imsak', 'Güneş': 'kutu-gunes', 'Öğle': 'kutu-ogle', 'İkindi': 'kutu-ikindi', 'Akşam': 'kutu-aksam', 'Yatsı': 'kutu-yatsi' };

    function apiValueFormatla(ilAdi) {
        return ilAdi.toLocaleLowerCase('tr-TR').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c');
    }

    function illeriListeyeYukle() {
        sehirListesiUl.innerHTML = ""; 
        TURKIYE_ILLERI.forEach(ilAdi => {
            const li = document.createElement('li');
            li.textContent = ilAdi;
            li.onclick = function() {
                const ilValue = apiValueFormatla(ilAdi);
                sehirSec(ilValue, ilAdi);
            };
            sehirListesiUl.appendChild(li);
        });
    }

    function sehirSec(ilValue, ilAdiGuzel) {
        sehirBaslik.innerHTML = `${ilAdiGuzel.toUpperCase()} <span class="arrow">▼</span>`;
        localStorage.setItem('sonSecilenSehir', ilValue);
        localStorage.setItem('sonSecilenSehirAdi', ilAdiGuzel);
        vakitleriGetir(ilValue);
        dropdownToggle();
    }

    async function vakitleriGetir(sehir) {
        const bugun = new Date();
        const bugununTarihi = bugun.toISOString().split('T')[0];
        const cacheKey = `vakitler_${sehir}_${bugununTarihi}`;

        try {
            const cacheliVeri = localStorage.getItem(cacheKey);
            if (cacheliVeri) {
                const data = JSON.parse(cacheliVeri); 
                ekranaBas(data.result);
                kalanSureyiHesapla(data.result);
                return; 
            }
        } catch (e) { console.error("Cache hatası:", e); }

        const url = `https://api.collectapi.com/pray/all?city=${sehir}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'authorization': `apikey ${API_KEY}`, 'content-type': 'application/json' }
            });
            if (!response.ok) throw new Error("API Hatası");
            const data = await response.json();
            if (data.success && data.result) {
                ekranaBas(data.result);
                kalanSureyiHesapla(data.result);
                localStorage.setItem(cacheKey, JSON.stringify(data)); 
            } 
        } catch (error) { console.error(error); alert("Veri alınamadı, internetinizi kontrol edin."); }
    }

    function ekranaBas(vakitler) {
        vakitP_elementleri.forEach(p_elementi => {
            const dataVakitAdi = p_elementi.getAttribute('data-vakit'); 
            const apiVakitAdi = vakitEslesme[dataVakitAdi];
            const bulunanVakit = vakitler.find(v => v.vakit === apiVakitAdi);
            if (bulunanVakit) p_elementi.textContent = bulunanVakit.saat;
        });
    }

    illeriListeyeYukle();
    const kayitliSehir = localStorage.getItem('sonSecilenSehir') || 'ankara';
    const kayitliSehirAdi = localStorage.getItem('sonSecilenSehirAdi') || 'ANKARA';
    sehirBaslik.innerHTML = `${kayitliSehirAdi.toUpperCase()} <span class="arrow">▼</span>`;
    vakitleriGetir(kayitliSehir);

    // --- SAYAÇ MANTIĞI (DÜZELTİLDİ: AZALAN DAİRE) ---
    function kalanSureyiHesapla(vakitler) {
        if (geriSayimInterval) clearInterval(geriSayimInterval);
        const simdiBase = new Date(); 
        const tumVakitler = vakitler.map(vakit => {
            const [saat, dakika] = vakit.saat.split(':');
            return { isim: vakit.vakit, zaman: new Date(simdiBase.getFullYear(), simdiBase.getMonth(), simdiBase.getDate(), parseInt(saat), parseInt(dakika), 0) };
        });

        function sayaciGuncelle() {
            const simdi = new Date(); 
            let sonrakiVakitIndex = tumVakitler.findIndex(v => v.zaman > simdi);
            let sonrakiVakit = tumVakitler[sonrakiVakitIndex];
            let oncekiVakit;

            if (!sonrakiVakit) {
                const yarinImsakZamani = new Date(tumVakitler[0].zaman);
                yarinImsakZamani.setDate(yarinImsakZamani.getDate() + 1); 
                sonrakiVakit = { isim: tumVakitler[0].isim, zaman: yarinImsakZamani };
                oncekiVakit = tumVakitler[tumVakitler.length - 1];
            } else {
                if (sonrakiVakitIndex === 0) {
                     const dunYatsi = new Date(tumVakitler[tumVakitler.length - 1].zaman);
                     dunYatsi.setDate(dunYatsi.getDate() - 1);
                     oncekiVakit = {zaman: dunYatsi};
                } else {
                    oncekiVakit = tumVakitler[sonrakiVakitIndex - 1];
                }
            }

            document.querySelectorAll('.kart').forEach(k => k.classList.remove('aktif-vakit'));
            const aktifKutuId = idEslesme[sonrakiVakit.isim];
            if(aktifKutuId) document.getElementById(aktifKutuId).classList.add('aktif-vakit');

            const farkMs = sonrakiVakit.zaman.getTime() - simdi.getTime();
            const toplamSaniye = Math.floor(farkMs / 1000);
            const saat = Math.floor(toplamSaniye / 3600);
            const dakika = Math.floor((toplamSaniye % 3600) / 60);
            const saniye = toplamSaniye % 60;

            sonrakiVakitIsim.textContent = sonrakiVakit.isim;
            kalanZaman.textContent = `${saat.toString().padStart(2, '0')}:${dakika.toString().padStart(2, '0')}:${saniye.toString().padStart(2, '0')}`;

            // --- DAİRE MANTIĞI DÜZELTMESİ BURADA ---
            const toplamSureMs = sonrakiVakit.zaman.getTime() - oncekiVakit.zaman.getTime();
            
            // Burayı değiştirdik: Artık 'farkMs' (Kalan süre) kullanıyoruz.
            // Kalan süre çoksa (vakit yeniyse) %100 olur, süre azaldıkça %0'a düşer.
            const yuzde = (farkMs / toplamSureMs) * 100;
            
            setProgress(Math.min(Math.max(yuzde, 0), 100)); 
        }
        sayaciGuncelle(); 
        geriSayimInterval = setInterval(sayaciGuncelle, 1000);
    }
});