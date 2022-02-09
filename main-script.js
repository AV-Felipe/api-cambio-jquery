// for prevention, in case of jquery cdn fail
window.jQuery || document.write('<script src="./modules/jquery-3.6.0.js"><\/script>');

import { availableConversions } from "./modules/available-options.js";

//GLOBAL VARIABLES
const $fromCurrency = $('#currency-a');
const $toCurrency = $('#currency-b');

const availableCurrencies = [];

// PREPARE MAIN OPTIONS
$.ajax({
    method: 'GET',
    url: 'https://economia.awesomeapi.com.br/json/all'
})
.done((data)=>{

    for (const key in data) {
        const newEntryName = data[key]['name'].split('/')[0];
        const newEntryValue = data[key]['code'];

        if (!availableCurrencies.includes(`${newEntryName}/${newEntryValue}`)){
            availableCurrencies.push(`${newEntryName}/${newEntryValue}`);
        }
    }
    
    $($toCurrency).prepend(`<option value="BRL">Real Brasileiro</option>`);

    availableCurrencies.map((currency)=>{
        const $newOption = $(`<option value="${currency.split('/')[1]}">${currency.split('/')[0]}</option>`);
        $newOption.appendTo($fromCurrency);
        $newOption.clone().appendTo($toCurrency);
    })

    
    $($fromCurrency).append(`<option value="BRL">Real Brasileiro</option>`);

})

$fromCurrency.on('change', function(evt){
    console.log(this.value)

})

// SHOW DATE FILTERING FIELDS
$('#interval-check').on('change', (event)=>{
    
    const $dateOptions = $('fieldset:eq(1)');

    if(event.target.checked){
        $dateOptions.show();
    }else{
        $dateOptions.hide();
    }
})

$('#convert-button').on('click', (evt)=>{
    const dateFilter = $('#interval-check').is(':checked');

    if($fromCurrency.val() === $toCurrency.val()){
        alert('Você deve escolher moedas de origem e destino diferentes!');
        return ('error');
    }

    let flag = false;
    availableConversions.forEach((element)=>{
        if(element.includes(`${$fromCurrency.val()}-${$toCurrency.val()}`)){
            flag = true;
        }
    });

    if (!flag){
        alert('conversão entre valores não disponível, selecione outro par');
        return ('error');
    }

    if(dateFilter){
        $('#current-conversion').hide();
        $('#evolution-plot').show();


        const initialDate = $('#initial-date').val();
        const endDate = $('#end-date').val();

        if (initialDate !== '' && endDate !== '' && Date.parse(initialDate) < Date.parse(endDate)){
            const lineCount = (Date.parse(endDate) - Date.parse(initialDate)) / (1000*60*60*24);
            const coins = `${$fromCurrency.val()}-${$toCurrency.val()}`;
            if(lineCount > 31){
                alert('Por favor, escolha um intervalo de datas de, no máximo, 30 dias');
                return('error');
            }
            getChangeTable(initialDate, endDate, lineCount, coins);
        } else {
            alert('Você deve selecionar uma data inicial e uma data final, sendo a primeira anterior a segunda');
            return('error');
        }

    }else{
        $('#current-conversion').show();
        $('#evolution-plot').hide();

        getCurrentChange($fromCurrency.val(), $toCurrency.val());
        changeFlag($fromCurrency.val(), $toCurrency.val());
    }

    
})

function getCurrentChange(fromValue, toValue){
    console.log(`converte de ${fromValue} para ${toValue}`)

    $.ajax({
        method: 'GET',
        url: `https://economia.awesomeapi.com.br/json/last/${fromValue}-${toValue}`
    })
    .done((data)=>{
        const returnedData = Object.entries(data)[0][1];
        const $valuesRenderingArea = $('li span:first-child', '#values-display');

        console.log(returnedData)

        const retrievedDate = returnedData.create_date.split(' ')[0].split('-');
        const retrievedTime = returnedData.create_date.split(' ')[1]

        $('#currentDate').text(`${retrievedDate[2]}/${retrievedDate[1]}/${retrievedDate[0]} - ${retrievedTime}`);

        $valuesRenderingArea.eq(0).text(returnedData.high);
        $valuesRenderingArea.eq(3).text(returnedData.low);
        $valuesRenderingArea.eq(1).text(returnedData.ask);
        $valuesRenderingArea.eq(2).text(returnedData.bid)
    })

}

function changeFlag(fromValue, toValue){
    const $flagsDisplay = $('li img', '#flag-display');

    console.log($flagsDisplay[0])

    $flagsDisplay.first().attr('src', `./assets/images/flags/${fromValue}.png`);
    $flagsDisplay.last().attr('src', `./assets/images/flags/${toValue}.png`)
}


function getChangeTable(dateA, dateB, interval, currencies){

    const $renderingTable = $('tbody', '#evolution-plot');

    $renderingTable.html('');

    const dateArray = [];

    while (interval >= 0){
        const newDate = new Date (Number(Date.parse(dateA + 'T00:00:00')))
        newDate.setDate(newDate.getDate() + interval)
        dateArray.push(newDate)
        interval--
    }

    const isoArray = [];
    dateArray.forEach((e)=>{isoArray.push(e.toISOString().split('T')[0])})

    isoArray.map((isoDate)=>{
        const startDate = isoDate.split('-')[0] + isoDate.split('-')[1] + isoDate.split('-')[2];

        $.ajax({
            method: 'GET',
            url: `https://economia.awesomeapi.com.br/${currencies}/?start_date=${startDate}&end_date=${startDate}`
        })
        .done((data)=>{
            console.log(data)

            $renderingTable.append(`<tr>
                <td>${isoDate}</td>
                <td>${data[0].low}</td>
                <td>${data[0].bid}</td>
                <td>${data[0].ask}</td>
                <td>${data[0].high}</td>
                </tr>`)

        })

    })


}