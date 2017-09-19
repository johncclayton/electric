#include <QCoreApplication>
#include <QtBluetooth/QLowEnergyAdvertisingData>
#include <QtBluetooth/QLowEnergyAdvertisingParameters>
#include <QtBluetooth/QLowEnergyCharacteristic>
#include <QtBluetooth/QLowEnergyCharacteristicData>
#include <QtBluetooth/QLowEnergyDescriptorData>
#include <QtBluetooth/QLowEnergyController>
#include <QtBluetooth/QLowEnergyService>
#include <QtBluetooth/QLowEnergyServiceData>
#include <QLoggingCategory>

#include <QByteArray>
#include <QList>
#include <QScopedPointer>
#include <QTimer>

int main(int argc, char *argv[])
{
    QCoreApplication a(argc, argv);

    QLowEnergyAdvertisingData adData;
    adData.setDiscoverability(QLowEnergyAdvertisingData::DiscoverabilityGeneral);
    adData.setIncludePowerLevel(true);
    adData.setLocalName("My Gatt Server Dude");
    adData.setServices(QList<QBluetoothUuid>() << QBluetoothUuid::HeartRate);

    QLowEnergyCharacteristicData charData;
    charData.setUuid(QBluetoothUuid::HeartRateMeasurement);
    charData.setValue(QByteArray(2, 0));
    charData.setProperties(QLowEnergyCharacteristic::Notify | QLowEnergyCharacteristic::Read);

    const QLowEnergyDescriptorData clientConfig(QBluetoothUuid::ClientCharacteristicConfiguration,
                                                QByteArray(2, 0));
    charData.addDescriptor(clientConfig);

    QLowEnergyServiceData serviceData;
    serviceData.setType(QLowEnergyServiceData::ServiceTypePrimary);
    serviceData.setUuid(QBluetoothUuid::HeartRate);
    serviceData.addCharacteristic(charData);

    const QScopedPointer<QLowEnergyController> leController(QLowEnergyController::createPeripheral());
    const QScopedPointer<QLowEnergyService> service(leController->addService(serviceData));

    qDebug() << "begin advertising stuff...";
    leController->startAdvertising(QLowEnergyAdvertisingParameters(), adData, adData);

    QTimer hbTimer;
    quint8 currentHeartRate = 60;
    enum ValueChange { ValueUp, ValueDown } valueChange = ValueUp;
    const auto heartbeatProvider = [ &service, &currentHeartRate, &valueChange ] () {
        QByteArray value;
        value.append(char(0));
        value.append(char(currentHeartRate));

        QLowEnergyCharacteristic charac = service->characteristic(QBluetoothUuid::HeartRateMeasurement);
        Q_ASSERT(charac.isValid());

        qDebug() << "changing characteristic to: " << value;
        service->writeCharacteristic(charac, value); // potentially causes notify

        if(currentHeartRate == 60)
            valueChange = ValueUp;
        else if(currentHeartRate == 100)
            valueChange = ValueDown;

        if(valueChange == ValueUp)
            ++currentHeartRate;
        else
            --currentHeartRate;
    };

    QLoggingCategory::setFilterRules(QStringLiteral("qt.bluetooth* = true"));

    QObject::connect(&hbTimer, &QTimer::timeout, heartbeatProvider);
    hbTimer.start(1000);

    return a.exec();
}
